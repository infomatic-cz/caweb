[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $PackagePath,

    # Name of the EXISTING IIS website, not a server hostname or URL.
    [string] $SiteName,

    [string] $ApplicationPath = 'caweb',
    [string] $AppPoolName = 'CAWeb',
    [string] $ServiceAccount,
    [switch] $UseApplicationPoolIdentity,
    [Alias('SiteRoot')] [string] $InstallRoot,
    [string] $DataPath = 'C:\ProgramData\CAWeb\data'
)

#Requires -Version 7.0
#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
# An IIS application, never an IIS website. One path segment only.
$applicationName = $ApplicationPath.Trim('/')
if ($applicationName -notmatch '^[A-Za-z0-9_-]+$') { throw 'ApplicationPath must be a single IIS path segment, e.g. caweb.' }
if ($ServiceAccount -and $UseApplicationPoolIdentity) { throw 'Do not combine -ServiceAccount with -UseApplicationPoolIdentity.' }

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this installer from an elevated PowerShell window.'
    }
}

# IIS management through the built-in AppCmd.exe. No WebAdministration module or IIS: drive needed.
# Tested by static review against IIS 10 AppCmd command syntax; actual server execution requires Windows/IIS.
function Initialize-IisNative {
    if (-not $IsWindows) { throw 'This deployment script must run on Windows Server.' }
    if (-not [Environment]::Is64BitProcess) { throw 'Use 64-bit PowerShell 7 (pwsh.exe), not x86 PowerShell.' }
    $script:AppCmdExe = Join-Path $env:SystemRoot 'System32\inetsrv\appcmd.exe'
    if (-not (Test-Path -LiteralPath $script:AppCmdExe -PathType Leaf)) {
        throw 'IIS AppCmd.exe is missing. Install the IIS Web Server and IIS Management Scripts and Tools features.'
    }
}

function Invoke-AppCmd {
    param([Parameter(Mandatory)][string[]] $Arguments)
    # Call the native executable with an array, preserving paths containing spaces.
    $lines = @(& $script:AppCmdExe @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
    $message = ($lines | ForEach-Object { [string]$_ }) -join "`n"
    if ($exitCode -ne 0) {
        throw "IIS AppCmd.exe failed (exit $exitCode): appcmd $($Arguments -join ' ')`n$message"
    }
    return $message
}

function Get-IisObjects {
    param([Parameter(Mandatory)][ValidateSet('site', 'app', 'vdir', 'apppool', 'module')][string] $Entity)
    $raw = Invoke-AppCmd -Arguments @('list', $Entity, '/xml')
    if ([string]::IsNullOrWhiteSpace($raw)) { return }
    try { [xml]$document = $raw }
    catch { throw "Cannot parse AppCmd XML for $Entity : $($_.Exception.Message)" }
    foreach ($entry in $document.DocumentElement.ChildNodes) {
        if ($entry.NodeType -eq [Xml.XmlNodeType]::Element) { $entry }
    }
}

function Get-IisSite {
    param([string] $Name)
    @(Get-IisObjects -Entity 'site') | Where-Object { $_.GetAttribute('SITE.NAME') -ieq $Name } | Select-Object -First 1
}

function Get-IisApplication {
    param([string] $SiteName, [string] $ApplicationName)
    $fullName = "$SiteName/$ApplicationName"
    @(Get-IisObjects -Entity 'app') | Where-Object { $_.GetAttribute('APP.NAME') -ieq $fullName } | Select-Object -First 1
}

function Get-IisPhysicalPath {
    param([string] $SiteName, [string] $ApplicationName)
    $fullName = "$SiteName/$ApplicationName/"
    $item = @(Get-IisObjects -Entity 'vdir') | Where-Object { $_.GetAttribute('VDIR.NAME') -ieq $fullName } | Select-Object -First 1
    if ($null -eq $item) { throw "The IIS root virtual directory '$fullName' was not found." }
    $path = $item.GetAttribute('physicalPath')
    if ([string]::IsNullOrWhiteSpace($path)) { throw "IIS virtual directory '$fullName' has no physical path." }
    return [Environment]::ExpandEnvironmentVariables($path)
}

function Get-IisAppPool {
    param([string] $Name)
    @(Get-IisObjects -Entity 'apppool') | Where-Object { $_.GetAttribute('APPPOOL.NAME') -ieq $Name } | Select-Object -First 1
}

function Test-IisHttpsBinding {
    param([Parameter(Mandatory)] $Site, [string] $Hostname, [switch] $Port443)
    $bindingText = $Site.GetAttribute('bindings')
    foreach ($binding in ($bindingText -split ',')) {
        if ($binding -notmatch '^https/(.*):(\d+):([^:]*)$') { continue }
        if ($Port443 -and [int]$Matches[2] -ne 443) { continue }
        if ($Hostname -and $Matches[3] -and $Matches[3] -ine $Hostname) { continue }
        return $true
    }
    return $false
}

function Ensure-IisAppPool {
    param([string] $PoolName, [string] $TargetApp, [switch] $AlwaysRunning)
    $existingPool = Get-IisAppPool -Name $PoolName
    if ($null -ne $existingPool) {
        # Do not reconfigure a pool that also hosts other applications.
        $otherApps = @(Get-IisObjects -Entity 'app') | Where-Object {
            $_.GetAttribute('APPPOOL.NAME') -ieq $PoolName -and $_.GetAttribute('APP.NAME') -ine $TargetApp
        }
        if ($otherApps.Count -gt 0) {
            throw "Pool '$PoolName' is shared with other IIS applications. Choose a dedicated -AppPoolName."
        }
    } else {
        Invoke-AppCmd -Arguments @('add', 'apppool', "/name:$PoolName") | Out-Null
        Invoke-AppCmd -Arguments @('set', 'apppool', $PoolName, '/processModel.identityType:ApplicationPoolIdentity') | Out-Null
    }
    $settings = @('set', 'apppool', $PoolName,
        '/managedRuntimeVersion:', '/managedPipelineMode:Integrated',
        '/enable32BitAppOnWin64:false')
    if ($AlwaysRunning) {
        $settings += @('/startMode:AlwaysRunning', '/processModel.idleTimeout:00:00:00')
    }
    Invoke-AppCmd -Arguments $settings | Out-Null
}

function Set-IisApplicationDeployment {
    param([string] $SiteName, [string] $ApplicationName, [string] $ReleasePath, [string] $PoolName,
          [switch] $Preload)
    $identity = "$SiteName/$ApplicationName"
    if ($null -eq (Get-IisApplication -SiteName $SiteName -ApplicationName $ApplicationName)) {
        Invoke-AppCmd -Arguments @('add', 'app', "/site.name:$SiteName", "/path:/$ApplicationName", "/physicalPath:$ReleasePath") | Out-Null
    } else {
        Invoke-AppCmd -Arguments @('set', 'vdir', "$identity/", "/physicalPath:$ReleasePath") | Out-Null
    }
    $settings = @('set', 'app', $identity, "/applicationPool:$PoolName")
    if ($Preload) { $settings += '/preloadEnabled:true' }
    Invoke-AppCmd -Arguments $settings | Out-Null
}


# IIS management API works directly in PowerShell 7; used ONLY for secure app-pool credentials.
# Never supply service account passwords on the AppCmd.exe command line.
function Initialize-IisPoolApi {
    $assembly = Join-Path $env:SystemRoot 'System32\inetsrv\Microsoft.Web.Administration.dll'
    if (-not (Test-Path -LiteralPath $assembly -PathType Leaf)) {
        throw 'Microsoft.Web.Administration.dll is missing. Install IIS Management Scripts and Tools.'
    }
    try { Add-Type -Path $assembly -ErrorAction Stop }
    catch { throw "Unable to load the IIS administration API in PowerShell 7: $($_.Exception.Message)" }
}

function Get-IisPoolPrincipal {
    param([Parameter(Mandatory)][string] $PoolName)
    $manager = [Microsoft.Web.Administration.ServerManager]::new()
    try {
        $pool = $manager.ApplicationPools[$PoolName]
        if ($null -eq $pool) { throw "Application pool '$PoolName' was not found." }
        switch ([string]$pool.ProcessModel.IdentityType) {
            'SpecificUser' {
                $account = [string]$pool.ProcessModel.UserName
                if ([string]::IsNullOrWhiteSpace($account)) {
                    throw "Application pool '$PoolName' has a custom identity without a user name."
                }
                return $account
            }
            'ApplicationPoolIdentity' { return "IIS AppPool\$PoolName" }
            'NetworkService'        { return 'NT AUTHORITY\NETWORK SERVICE' }
            'LocalService'          { return 'NT AUTHORITY\LOCAL SERVICE' }
            'LocalSystem'           { return 'NT AUTHORITY\SYSTEM' }
            default { throw "Unsupported identity type for '$PoolName': $($pool.ProcessModel.IdentityType)" }
        }
    } finally { $manager.Dispose() }
}

function Set-IisPoolAccount {
    param(
        [Parameter(Mandatory)][string] $PoolName,
        [string] $ServiceAccount,
        [switch] $UseApplicationPoolIdentity,
        [switch] $NewInstallation
    )
    if (-not [string]::IsNullOrWhiteSpace($ServiceAccount) -and $UseApplicationPoolIdentity) {
        throw 'Choose either -ServiceAccount or -UseApplicationPoolIdentity, not both.'
    }
    if ([string]::IsNullOrWhiteSpace($ServiceAccount) -and -not $UseApplicationPoolIdentity -and -not $NewInstallation) {
        # Keep the existing pool identity and its stored credentials on upgrades.
        return
    }

    $manager = [Microsoft.Web.Administration.ServerManager]::new()
    try {
        $pool = $manager.ApplicationPools[$PoolName]
        if ($null -eq $pool) { throw "Application pool '$PoolName' does not exist." }
        if ($UseApplicationPoolIdentity -or ($NewInstallation -and [string]::IsNullOrWhiteSpace($ServiceAccount))) {
            $pool.ProcessModel.IdentityType = [Microsoft.Web.Administration.ProcessModelIdentityType]::ApplicationPoolIdentity
            $pool.ProcessModel.UserName = ''
            $pool.ProcessModel.Password = ''
            $manager.CommitChanges()
            return
        }

        $accountName = $ServiceAccount.Trim()
        if ($accountName -notmatch '^(?:[^\\]+\\[^\\]+|[^@]+@[^@]+)$') {
            throw 'ServiceAccount must be DOMAIN\\user, .\\localuser, or user@domain.'
        }
        # Verify that the account exists and is resolvable before requesting its password.
        try {
            $sid = ([Security.Principal.NTAccount]::new($accountName)).Translate([Security.Principal.SecurityIdentifier])
        } catch { throw "Windows cannot resolve service account '$accountName'. Check the account and domain connectivity." }
        if ($sid.Value -in @('S-1-5-18', 'S-1-5-19', 'S-1-5-20', 'S-1-5-32-544')) {
            throw 'A built-in privileged or service account cannot be passed via -ServiceAccount.'
        }
        Write-Host "Password for IIS application-pool identity $accountName (input hidden):" -ForegroundColor Cyan
        $secret = Read-Host -Prompt 'Password' -AsSecureString
        if ($null -eq $secret -or $secret.Length -eq 0) { throw 'A nonempty service account password is required.' }
        $secretPointer = [IntPtr]::Zero
        $passwordText = $null
        try {
            $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
            $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
            $pool.ProcessModel.IdentityType = [Microsoft.Web.Administration.ProcessModelIdentityType]::SpecificUser
            $pool.ProcessModel.UserName = $accountName
            $pool.ProcessModel.Password = $passwordText
            $manager.CommitChanges()  # IIS encrypts this sensitive setting in applicationHost.config.
        } catch {
            # Deliberately avoid embedding the provider exception (may expose sensitive information).
            throw "Failed to configure custom identity for application pool '$PoolName'. Review IIS and Windows Event Logs."
        } finally {
            $passwordText = $null
            if ($secretPointer -ne [IntPtr]::Zero) {
                [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
            }
            $secret.Dispose()
        }
    } finally { $manager.Dispose() }
}

function Remove-PreviousDataAccess {
    param([string]$Path, [string]$PreviousAccount, [string]$NewAccount)
    if ([string]::IsNullOrWhiteSpace($PreviousAccount) -or $PreviousAccount -ieq $NewAccount) { return }
    if ($PreviousAccount -in @('NT AUTHORITY\SYSTEM', 'BUILTIN\Administrators')) { return }
    # This directory belongs exclusively to the application, so stale worker access is removed.
    $acl = Get-Acl -LiteralPath $Path
    try { $oldSid = ([Security.Principal.NTAccount]::new($PreviousAccount)).Translate([Security.Principal.SecurityIdentifier]) }
    catch { Write-Warning "Could not resolve old account '$PreviousAccount' to remove its previous ACL. Check permissions manually."; return }
    foreach ($rule in @($acl.Access)) {
        try { $ruleSid = $rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]) }
        catch { continue }
        if ($ruleSid.Value -eq $oldSid.Value -and -not $rule.IsInherited) {
            [void] $acl.RemoveAccessRuleSpecific($rule)
        }
    }
    Set-Acl -LiteralPath $Path -AclObject $acl
}

function Start-Or-RecycleIisPool {
    param([string] $PoolName, [switch] $RecycleIfStarted)
    $pool = Get-IisAppPool -Name $PoolName
    if ($null -eq $pool) { throw "Application pool '$PoolName' does not exist." }
    $status = $pool.GetAttribute('state')
    if ($status -eq 'Started') {
        if ($RecycleIfStarted) { Invoke-AppCmd -Arguments @('recycle', 'apppool', $PoolName) | Out-Null }
    } else {
        Invoke-AppCmd -Arguments @('start', 'apppool', $PoolName) | Out-Null
    }
}

# Interactive installation root, identical behavior for both IIS application deployments.
# The archive contents are placed under <root>\releases\<version>.
function Get-InstallRoot {
    param([string] $RequestedRoot, [string] $DefaultRoot, [string] $ApplicationLabel)
    $selected = $RequestedRoot
    if ([string]::IsNullOrWhiteSpace($selected)) {
        Write-Host "Select the ROOT directory for $ApplicationLabel releases (ZIP contents go to <root>\releases\<version>)." -ForegroundColor Cyan
        $reply = Read-Host -Prompt "Installation root [$DefaultRoot]"
        $selected = if ([string]::IsNullOrWhiteSpace($reply)) { $DefaultRoot } else { $reply.Trim() }
    }
    $selected = $selected.Trim().Trim('"')
    if ([string]::IsNullOrWhiteSpace($selected)) { throw 'The installation root cannot be empty.' }
    if (-not [IO.Path]::IsPathFullyQualified($selected) -or $selected -notmatch '^[A-Za-z]:\\') {
        throw 'Installation root must be an absolute local path, for example C:\Apps\MyApp. UNC and relative paths are not supported.'
    }
    $full = [IO.Path]::GetFullPath($selected).TrimEnd('\')
    $driveRoot = [IO.Path]::GetPathRoot($full).TrimEnd('\')
    if ($full -ieq $driveRoot) { throw 'Installation root cannot be a drive root. Choose a dedicated directory.' }
    if ($full -ieq $env:SystemRoot.TrimEnd('\') -or $env:SystemRoot.StartsWith($full + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Installation root cannot be the Windows directory or one of its ancestors.'
    }
    return $full
}

Assert-Administrator
Initialize-IisNative
Initialize-IisPoolApi
$siteRootPath = Get-InstallRoot -RequestedRoot $InstallRoot -DefaultRoot 'C:\inetpub\CAWeb' -ApplicationLabel 'CAWeb'

$archive = (Resolve-Path -LiteralPath $PackagePath -ErrorAction Stop).Path
if ([IO.Path]::GetExtension($archive) -ine '.zip') { throw 'PackagePath must point to the CAWeb release ZIP.' }
$AppPoolName = $AppPoolName.Trim()
if ($AppPoolName -notmatch '^[A-Za-z0-9_.-]{1,64}$') { throw 'AppPoolName must contain only letters, numbers, dot, underscore or hyphen.' }
# IIS 10 + ASP.NET Core 10 use ANCM V2; testing only aspnetcore.dll misses valid installations.
$ancmV2 = Join-Path $env:ProgramFiles 'IIS\Asp.Net Core Module\V2\aspnetcorev2.dll'
if (-not (Test-Path -LiteralPath $ancmV2 -PathType Leaf)) {
    throw 'ASP.NET Core Module V2 was not found. Install the .NET 10 ASP.NET Core Hosting Bundle, then rerun.'
}

$sites = @(Get-IisObjects -Entity 'site')
if (-not [string]::IsNullOrWhiteSpace($SiteName)) {
    $targetSite = Get-IisSite -Name $SiteName
    if ($null -eq $targetSite) { throw "The existing IIS website '$SiteName' was not found." }
} else {
    $httpsSites = @($sites | Where-Object {
        $_.GetAttribute('state') -eq 'Started' -and (Test-IisHttpsBinding -Site $_)
    })
    if ($httpsSites.Count -eq 1) { $targetSite = $httpsSites[0] }
    elseif ($httpsSites.Count -gt 1) {
        $available = ($httpsSites | ForEach-Object { $_.GetAttribute('SITE.NAME') }) -join ', '
        throw "More than one started IIS website uses HTTPS ($available). Provide -SiteName '<IIS site name>'."
    } else {
        throw 'No running IIS website with an HTTPS binding was found. Start the website or specify -SiteName.'
    }
}
$targetSiteName = $targetSite.GetAttribute('SITE.NAME')
if (-not (Test-IisHttpsBinding -Site $targetSite)) { throw "The IIS website '$targetSiteName' has no HTTPS binding." }
if ($targetSite.GetAttribute('state') -ne 'Started') { throw "IIS website '$targetSiteName' is not started." }

$dataPath = [IO.Path]::GetFullPath($DataPath).TrimEnd('\')
$driveRoot = [IO.Path]::GetPathRoot($dataPath).TrimEnd('\')
if ($dataPath -eq $driveRoot -or $dataPath.StartsWith($siteRootPath + '\', [StringComparison]::OrdinalIgnoreCase) -or
    $siteRootPath.StartsWith($dataPath + '\', [StringComparison]::OrdinalIgnoreCase) -or $dataPath -eq $siteRootPath) {
    throw 'DataPath must be a dedicated directory outside the IIS release directory.'
}
$releaseRoot = Join-Path $siteRootPath 'releases'
$stagingPath = Join-Path ([IO.Path]::GetTempPath()) ("CAWeb-install-" + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $releaseRoot -Force
$null = New-Item -ItemType Directory -Path $stagingPath -Force
try {
    Expand-Archive -LiteralPath $archive -DestinationPath $stagingPath
    $manifestPath = Join-Path $stagingPath 'caweb-release.json'
    $executablePath = Join-Path $stagingPath 'CAWeb.exe'
    if (-not (Test-Path -LiteralPath $manifestPath) -or -not (Test-Path -LiteralPath $executablePath)) {
        throw 'The release ZIP is missing its version manifest or application executable.'
    }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.application -ne 'CAWeb' -or $manifest.version -notmatch '^\d+\.\d+\.\d+$') {
        throw 'The release manifest is invalid.'
    }

    $existingApplication = Get-IisApplication -SiteName $targetSiteName -ApplicationName $applicationName
    if ($null -ne $existingApplication) {
        $oldManifest = Join-Path (Get-IisPhysicalPath -SiteName $targetSiteName -ApplicationName $applicationName) 'caweb-release.json'
        if (-not (Test-Path -LiteralPath $oldManifest)) {
            throw "The existing IIS application /$applicationName is not a CAWeb installation. It was left unchanged."
        }
        $oldIdentity = Get-Content -LiteralPath $oldManifest -Raw | ConvertFrom-Json
        if ($oldIdentity.application -ne 'CAWeb') { throw "The existing IIS application /$applicationName is not CAWeb. It was left unchanged." }
    }

    $publishedWebConfig = Join-Path $stagingPath 'web.config'
    if (-not (Test-Path -LiteralPath $publishedWebConfig -PathType Leaf)) { throw 'CAWeb release is missing web.config.' }
    [xml]$publishedConfig = Get-Content -LiteralPath $publishedWebConfig -Raw
    if ($null -eq $publishedConfig.configuration.'system.webServer'.aspNetCore) {
        throw 'The published web.config does not contain the ASP.NET Core handler configuration.'
    }

    $releasePath = Join-Path $releaseRoot $manifest.version
    if (Test-Path -LiteralPath $releasePath) { throw "Release $($manifest.version) is already installed. Keep existing releases for rollback." }
    Move-Item -LiteralPath $stagingPath -Destination $releasePath
    $stagingPath = $null

    # The virtual IIS AppPool identity must exist before Windows can resolve its SID in ACLs.
    Ensure-IisAppPool -PoolName $AppPoolName -TargetApp "$targetSiteName/$applicationName"
    $previousPrincipal = Get-IisPoolPrincipal -PoolName $AppPoolName
    Set-IisPoolAccount -PoolName $AppPoolName -ServiceAccount $ServiceAccount `
        -UseApplicationPoolIdentity:$UseApplicationPoolIdentity -NewInstallation:($null -eq $existingApplication)
    $poolPrincipal = Get-IisPoolPrincipal -PoolName $AppPoolName

    $null = New-Item -ItemType Directory -Path $dataPath -Force
    $accessControl = Get-Acl -LiteralPath $dataPath
    $identityName = $poolPrincipal
    $accessControl.SetAccessRuleProtection($true, $false)
    $accessControl.SetOwner([Security.Principal.NTAccount]::new('BUILTIN\Administrators'))
    foreach ($principalName in @('SYSTEM', 'BUILTIN\Administrators')) {
        $adminRule = [Security.AccessControl.FileSystemAccessRule]::new($principalName, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
        $accessControl.SetAccessRule($adminRule)
    }
    $dataRule = [Security.AccessControl.FileSystemAccessRule]::new($identityName, 'Modify', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $accessControl.SetAccessRule($dataRule)
    Set-Acl -LiteralPath $dataPath -AclObject $accessControl
    Remove-PreviousDataAccess -Path $dataPath -PreviousAccount $previousPrincipal -NewAccount $poolPrincipal

    $releaseAcl = Get-Acl -LiteralPath $releasePath
    $readRule = [Security.AccessControl.FileSystemAccessRule]::new($identityName, 'ReadAndExecute', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $releaseAcl.SetAccessRule($readRule)
    Set-Acl -LiteralPath $releasePath -AclObject $releaseAcl

    $webConfigPath = Join-Path $releasePath 'web.config'
    if (-not (Test-Path -LiteralPath $webConfigPath -PathType Leaf)) { throw 'CAWeb release is missing web.config.' }
    [xml] $webConfig = Get-Content -LiteralPath $webConfigPath -Raw
    $aspNetCore = $webConfig.configuration.'system.webServer'.aspNetCore
    if ($null -eq $aspNetCore) { throw 'The published web.config does not contain the ASP.NET Core handler configuration.' }
    if ($null -eq $aspNetCore.environmentVariables) {
        $environmentVariables = $webConfig.CreateElement('environmentVariables')
        [void] $aspNetCore.AppendChild($environmentVariables)
    }
    $dataVariable = @($aspNetCore.environmentVariables.environmentVariable) | Where-Object { $_.name -eq 'CAWEB_DATA_DIR' } | Select-Object -First 1
    if ($null -eq $dataVariable) {
        $dataVariable = $webConfig.CreateElement('environmentVariable')
        $dataVariable.SetAttribute('name', 'CAWEB_DATA_DIR')
        [void] $aspNetCore.environmentVariables.AppendChild($dataVariable)
    }
    $dataVariable.SetAttribute('value', $dataPath)
    $webConfig.Save($webConfigPath)

    Set-IisApplicationDeployment -SiteName $targetSiteName -ApplicationName $applicationName -ReleasePath $releasePath -PoolName $AppPoolName
    Start-Or-RecycleIisPool -PoolName $AppPoolName -RecycleIfStarted:($null -ne $existingApplication)

    Write-Host "CAWeb $($manifest.version) is installed as /$applicationName under the existing IIS website '$($targetSiteName)'." -ForegroundColor Green
    Write-Host "Open https://<the existing site's host>/$applicationName/"
    Write-Host 'The parent website, HTTPS bindings, certificate and root application were not changed.'
    Write-Host "Release folder: $releasePath"
    Write-Host "Application data: $dataPath"
    Write-Host "Application pool: $AppPoolName (identity: $poolPrincipal)"
} finally {
    if ($stagingPath -and (Test-Path -LiteralPath $stagingPath)) { Remove-Item -LiteralPath $stagingPath -Recurse -Force }
}

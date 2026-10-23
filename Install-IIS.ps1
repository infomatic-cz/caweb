[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $PackagePath,

    # Optional only when IIS hosts multiple HTTPS websites. This is the existing IIS site name, not a URL or hostname.
    [string] $SiteName,

    [string] $AppPoolName = 'CAWeb',
    [string] $SiteRoot = 'C:\inetpub\CAWeb',
    [string] $DataPath = 'C:\ProgramData\CAWeb\data'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$applicationName = 'caweb'

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this installer from an elevated PowerShell window.'
    }
}

Assert-Administrator

$archive = (Resolve-Path -LiteralPath $PackagePath).Path
if ([IO.Path]::GetExtension($archive) -ne '.zip') { throw 'PackagePath must point to the CAWeb release ZIP.' }
if (-not (Get-Module -ListAvailable -Name WebAdministration)) { throw 'Install the IIS management tools before deploying CAWeb.' }
Import-Module WebAdministration -ErrorAction Stop
if (-not (Test-Path -LiteralPath "$env:windir\System32\inetsrv\aspnetcore.dll")) {
    throw 'The .NET 10 ASP.NET Core Hosting Bundle is not installed. Install it once for IIS, then run this installer again.'
}

$sites = @(Get-Website)
if (-not [string]::IsNullOrWhiteSpace($SiteName)) {
    $targetSite = $sites | Where-Object { $_.Name -eq $SiteName } | Select-Object -First 1
    if ($null -eq $targetSite) { throw "The existing IIS website '$SiteName' was not found." }
} else {
    $httpsSites = @(
        foreach ($candidate in $sites) {
            $candidateBindings = @(Get-WebBinding -Name $candidate.Name -Protocol https -ErrorAction SilentlyContinue)
            if ($candidate.State -eq 'Started' -and $candidateBindings.Count -gt 0) { $candidate }
        }
    )
    if ($httpsSites.Count -eq 1) {
        $targetSite = $httpsSites[0]
    } elseif ($httpsSites.Count -gt 1) {
        $available = ($httpsSites | ForEach-Object { $_.Name }) -join ', '
        throw "More than one running IIS website already has HTTPS ($available). Re-run with -SiteName '<existing IIS site name>' to choose where /caweb belongs."
    } else {
        throw 'No running IIS website with an existing HTTPS binding was found. Start the website that should host /caweb or specify its name with -SiteName.'
    }
}
$httpsBindings = @(Get-WebBinding -Name $targetSite.Name -Protocol https -ErrorAction SilentlyContinue)
if ($httpsBindings.Count -eq 0) { throw "The existing IIS website '$($targetSite.Name)' has no HTTPS binding. CAWeb does not create or change site bindings." }
if ($targetSite.State -ne 'Started') { throw "The existing IIS website '$($targetSite.Name)' is not started. Start it in IIS Manager, then run this installer again." }

$siteRootPath = [IO.Path]::GetFullPath($SiteRoot).TrimEnd('\')
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

    $existingApplication = @(Get-WebApplication -Site $targetSite.Name | Where-Object { $_.Name -ieq $applicationName -or $_.Path -ieq "/$applicationName" }) | Select-Object -First 1
    if ($null -ne $existingApplication) {
        $oldManifest = Join-Path $existingApplication.PhysicalPath 'caweb-release.json'
        if (-not (Test-Path -LiteralPath $oldManifest)) {
            throw "The existing IIS application /$applicationName is not a CAWeb installation. It was left unchanged."
        }
        $oldIdentity = Get-Content -LiteralPath $oldManifest -Raw | ConvertFrom-Json
        if ($oldIdentity.application -ne 'CAWeb') { throw "The existing IIS application /$applicationName is not CAWeb. It was left unchanged." }
    }

    $releasePath = Join-Path $releaseRoot $manifest.version
    if (Test-Path -LiteralPath $releasePath) { throw "Release $($manifest.version) is already installed. Keep existing releases for rollback." }
    Move-Item -LiteralPath $stagingPath -Destination $releasePath
    $stagingPath = $null

    $null = New-Item -ItemType Directory -Path $dataPath -Force
    $accessControl = Get-Acl -LiteralPath $dataPath
    $identityName = "IIS AppPool\$AppPoolName"
    $accessControl.SetAccessRuleProtection($true, $false)
    $accessControl.SetOwner([Security.Principal.NTAccount]::new('BUILTIN\Administrators'))
    foreach ($principalName in @('SYSTEM', 'BUILTIN\Administrators')) {
        $adminRule = [Security.AccessControl.FileSystemAccessRule]::new($principalName, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
        $accessControl.SetAccessRule($adminRule)
    }
    $dataRule = [Security.AccessControl.FileSystemAccessRule]::new($identityName, 'Modify', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $accessControl.SetAccessRule($dataRule)
    Set-Acl -LiteralPath $dataPath -AclObject $accessControl

    $releaseAcl = Get-Acl -LiteralPath $releasePath
    $readRule = [Security.AccessControl.FileSystemAccessRule]::new($identityName, 'ReadAndExecute', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $releaseAcl.SetAccessRule($readRule)
    Set-Acl -LiteralPath $releasePath -AclObject $releaseAcl

    $webConfigPath = Join-Path $releasePath 'web.config'
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

    $pool = Get-Item -LiteralPath "IIS:\AppPools\$AppPoolName" -ErrorAction SilentlyContinue
    if ($null -eq $pool) { $null = New-WebAppPool -Name $AppPoolName }
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ''
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name managedPipelineMode -Value 'Integrated'
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name enable32BitAppOnWin64 -Value $false
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name processModel.identityType -Value 'ApplicationPoolIdentity'

    if ($null -eq $existingApplication) {
        $null = New-WebApplication -Site $targetSite.Name -Name $applicationName -PhysicalPath $releasePath -ApplicationPool $AppPoolName
    } else {
        $iisApplicationPath = "IIS:\Sites\$($targetSite.Name)\$applicationName"
        Set-ItemProperty -LiteralPath $iisApplicationPath -Name physicalPath -Value $releasePath
        Set-ItemProperty -LiteralPath $iisApplicationPath -Name applicationPool -Value $AppPoolName
    }

    if ((Get-WebAppPoolState -Name $AppPoolName).Value -ne 'Started') { Start-WebAppPool -Name $AppPoolName }
    Write-Host "CAWeb $($manifest.version) is installed as /$applicationName under the existing IIS website '$($targetSite.Name)'." -ForegroundColor Green
    Write-Host "Open https://<the existing site's host>/$applicationName/"
    Write-Host 'The parent website, HTTPS bindings, certificate and root application were not changed.'
    Write-Host "Application data: $dataPath"
    Write-Host "Application pool: $AppPoolName (ApplicationPoolIdentity)"
} finally {
    if ($stagingPath -and (Test-Path -LiteralPath $stagingPath)) { Remove-Item -LiteralPath $stagingPath -Recurse -Force }
}

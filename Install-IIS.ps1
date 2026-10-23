[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $PackagePath,

    [Parameter(Mandatory)]
    [ValidatePattern('^[A-Za-z0-9.-]+$')]
    [string] $HostName,

    [Parameter(Mandatory)]
    [ValidatePattern('^[A-Fa-f0-9 ]{40,64}$')]
    [string] $HttpsCertificateThumbprint,

    [string] $SiteName = 'CAWeb',
    [string] $AppPoolName = 'CAWeb',
    [string] $SiteRoot = 'C:\inetpub\CAWeb',
    [string] $DataPath = 'C:\ProgramData\CAWeb\data',
    [ValidateRange(1, 65535)]
    [int] $HttpsPort = 443
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

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
$thumbprint = ($HttpsCertificateThumbprint -replace '\s', '').ToUpperInvariant()
$bindingCertificate = Get-Item -LiteralPath "Cert:\LocalMachine\My\$thumbprint" -ErrorAction Stop
if (-not $bindingCertificate.HasPrivateKey) { throw 'The HTTPS binding certificate must include its private key.' }
if ($bindingCertificate.NotAfter.ToUniversalTime() -le [DateTime]::UtcNow) { throw 'The HTTPS binding certificate is expired.' }

Import-Module WebAdministration -ErrorAction Stop
if (-not (Get-Module -ListAvailable -Name WebAdministration)) { throw 'Install the IIS management tools before deploying CAWeb.' }
if (-not (Test-Path -LiteralPath "$env:windir\System32\inetsrv\aspnetcore.dll")) {
    throw 'Install the ASP.NET Core Hosting Bundle for .NET 10, then restart IIS before deploying CAWeb.'
}

$siteRootPath = [IO.Path]::GetFullPath($SiteRoot)
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

    $releasePath = Join-Path $releaseRoot $manifest.version
    if (Test-Path -LiteralPath $releasePath) { throw "Release $($manifest.version) is already installed. Keep existing release folders for rollback." }
    Move-Item -LiteralPath $stagingPath -Destination $releasePath
    $stagingPath = $null

    $null = New-Item -ItemType Directory -Path $DataPath -Force
    $accessControl = Get-Acl -LiteralPath $DataPath
    $identityName = "IIS AppPool\$AppPoolName"
    $accessControl.SetAccessRuleProtection($true, $false)
    $accessControl.SetOwner([Security.Principal.NTAccount]::new('BUILTIN\Administrators'))
    foreach ($principalName in @('SYSTEM', 'BUILTIN\Administrators')) {
        $adminRule = [Security.AccessControl.FileSystemAccessRule]::new($principalName, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
        $accessControl.SetAccessRule($adminRule)
    }
    $dataRule = [Security.AccessControl.FileSystemAccessRule]::new($identityName, 'Modify', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $accessControl.SetAccessRule($dataRule)
    Set-Acl -LiteralPath $DataPath -AclObject $accessControl

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
    $dataVariable.SetAttribute('value', [IO.Path]::GetFullPath($DataPath))
    $webConfig.Save($webConfigPath)

    $pool = Get-Item -LiteralPath "IIS:\AppPools\$AppPoolName" -ErrorAction SilentlyContinue
    if ($null -eq $pool) { $null = New-WebAppPool -Name $AppPoolName }
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ''
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name managedPipelineMode -Value 'Integrated'
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name enable32BitAppOnWin64 -Value $false
    Set-ItemProperty -LiteralPath "IIS:\AppPools\$AppPoolName" -Name processModel.identityType -Value 'ApplicationPoolIdentity'

    $site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    if ($null -eq $site) {
        $null = New-Website -Name $SiteName -PhysicalPath $releasePath -ApplicationPool $AppPoolName -Port $HttpsPort -HostHeader $HostName -IPAddress '*' -Ssl -SslFlags 1
    } else {
        if ($site.State -eq 'Started') { Stop-Website -Name $SiteName }
        Set-ItemProperty -LiteralPath "IIS:\Sites\$SiteName" -Name physicalPath -Value $releasePath
        Set-ItemProperty -LiteralPath "IIS:\Sites\$SiteName" -Name applicationPool -Value $AppPoolName
    }

    Get-WebBinding -Name $SiteName -Protocol http -ErrorAction SilentlyContinue | Remove-WebBinding
    $binding = Get-WebBinding -Name $SiteName -Protocol https -Port $HttpsPort -ErrorAction SilentlyContinue | Where-Object { $_.bindingInformation -like "*:${HttpsPort}:$HostName" } | Select-Object -First 1
    if ($null -eq $binding) {
        New-WebBinding -Name $SiteName -Protocol https -IPAddress '*' -Port $HttpsPort -HostHeader $HostName -SslFlags 1
        $binding = Get-WebBinding -Name $SiteName -Protocol https -Port $HttpsPort | Where-Object { $_.bindingInformation -like "*:${HttpsPort}:$HostName" } | Select-Object -First 1
    }
    $binding.AddSslCertificate($thumbprint, 'My')

    if ((Get-WebAppPoolState -Name $AppPoolName).Value -ne 'Started') { Start-WebAppPool -Name $AppPoolName }
    Start-Website -Name $SiteName
    Write-Host "CAWeb $($manifest.version) is installed at https://${HostName}:$HttpsPort/" -ForegroundColor Green
    Write-Host "Application data: $([IO.Path]::GetFullPath($DataPath))"
    Write-Host "IIS application pool: $AppPoolName (ApplicationPoolIdentity)"
} finally {
    if ($stagingPath -and (Test-Path -LiteralPath $stagingPath)) { Remove-Item -LiteralPath $stagingPath -Recurse -Force }
}

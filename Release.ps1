[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string] $Summary
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$sourceRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$buildRoot = 'C:\Temp\CAWeb-Build'
$expectedRemote = 'https://github.com/infomatic-cz/caweb.git'
$buildRoot = [IO.Path]::GetFullPath($buildRoot)
$null = New-Item -ItemType Directory -Path $buildRoot -Force

function Invoke-Git {
    param([Parameter(Mandatory)][string[]] $Arguments)
    $output = & git @Arguments
    if ($LASTEXITCODE -ne 0) { throw "git $($Arguments[0]) failed with exit code $LASTEXITCODE." }
    return $output
}

function Reset-BuildDirectory {
    param([Parameter(Mandatory)][string] $Path)
    $absolute = [IO.Path]::GetFullPath($Path)
    $prefix = $buildRoot.TrimEnd('\') + '\'
    if (-not $absolute.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to clean a path outside $buildRoot."
    }
    if (Test-Path -LiteralPath $absolute) { Remove-Item -LiteralPath $absolute -Recurse -Force }
    $null = New-Item -ItemType Directory -Path $absolute -Force
}

function Add-ChangelogEntry {
    param([string] $Path, [string] $Version, [string] $Text)
    $contents = [IO.File]::ReadAllText($Path)
    $newline = if ($contents.Contains("`r`n")) { "`r`n" } else { "`n" }
    $separator = $contents.IndexOf($newline, [StringComparison]::Ordinal)
    if ($separator -lt 0) { throw 'CHANGELOG.md must start with a heading line.' }
    $heading = $contents.Substring(0, $separator)
    $remaining = $contents.Substring($separator + $newline.Length).TrimStart([char[]] @("`r", "`n"))
    $today = Get-Date -Format 'yyyy-MM-dd'
    $entry = "## $Version — $today$newline$newline- $Text$newline$newline"
    $updated = $heading + $newline + $newline + $entry + $remaining
    [IO.File]::WriteAllText($Path, $updated, [Text.UTF8Encoding]::new($false))
}

if ((Get-Location).Path -ne $sourceRoot) { Set-Location -LiteralPath $sourceRoot }
if ((Invoke-Git -Arguments @('branch', '--show-current')) -ne 'main') { throw 'Releases are published directly from the main branch.' }
$remoteUrl = ((Invoke-Git -Arguments @('remote', 'get-url', 'origin')) | Select-Object -First 1).TrimEnd('/')
$remoteCanonical = $remoteUrl -replace '\.git$', ''
$expectedCanonical = $expectedRemote -replace '\.git$', ''
if ($remoteUrl -match '://[^/@]+@' -or $remoteCanonical -ne $expectedCanonical) {
    throw 'The configured origin does not match https://github.com/infomatic-cz/caweb.git.'
}

# Pull any direct GitHub edits on main into this checkout without dropping local work.
$remoteHeads = & git ls-remote --heads origin main
if ($LASTEXITCODE -ne 0) { throw 'Could not read the remote main branch.' }
if ($remoteHeads) {
    Invoke-Git -Arguments @('fetch', 'origin', 'main') | Out-Null
    $aheadBehind = (Invoke-Git -Arguments @('rev-list', '--left-right', '--count', 'HEAD...origin/main')) -split '\s+'
    $remoteAhead = [int] $aheadBehind[1]
    if ($remoteAhead -gt 0) {
        $stashNeeded = @(& git status --porcelain).Count -gt 0
        if ($stashNeeded) { Invoke-Git -Arguments @('stash', 'push', '--include-untracked', '-m', 'CAWeb release auto-stash') | Out-Null }
        try {
            $mergeBase = & git merge-base HEAD origin/main
            if ($LASTEXITCODE -eq 0 -and $mergeBase) {
                Invoke-Git -Arguments @('rebase', 'origin/main') | Out-Null
            } else {
                Invoke-Git -Arguments @('merge', '--no-edit', '--allow-unrelated-histories', 'origin/main') | Out-Null
            }
        } catch {
            & git rebase --abort 2>$null | Out-Null
            & git merge --abort 2>$null | Out-Null
            if ($stashNeeded) { & git stash pop | Out-Null }
            throw 'Remote main contains edits that conflict with local work. The local work was restored; resolve the conflict and retry the release.'
        }
        if ($stashNeeded) {
            & git stash pop
            if ($LASTEXITCODE -ne 0) { throw 'The remote update is integrated, but restoring local edits caused conflicts. Resolve them and retry; the stash is retained.' }
        }
    }
}

$projectPath = Join-Path $sourceRoot 'CAWeb.csproj'
$projectText = [IO.File]::ReadAllText($projectPath)
$versionMatch = [regex]::Match($projectText, '<Version>(\d+)\.(\d+)\.(\d+)</Version>')
if (-not $versionMatch.Success) { throw 'CAWeb.csproj must contain a semantic version in the Version property.' }
$major = [int] $versionMatch.Groups[1].Value
$minor = [int] $versionMatch.Groups[2].Value
$patch = [int] $versionMatch.Groups[3].Value + 1
$version = "$major.$minor.$patch"
$projectText = [regex]::Replace($projectText, '<Version>\d+\.\d+\.\d+</Version>', "<Version>$version</Version>", 1)
[IO.File]::WriteAllText($projectPath, $projectText, [Text.UTF8Encoding]::new($false))

$workerPath = Join-Path $sourceRoot 'wwwroot\service-worker.js'
$workerText = [IO.File]::ReadAllText($workerPath)
$workerText = [regex]::Replace($workerText, "const CACHE = 'caweb-shell-\d+\.\d+\.\d+';", "const CACHE = 'caweb-shell-$version';", 1)
[IO.File]::WriteAllText($workerPath, $workerText, [Text.UTF8Encoding]::new($false))

$summaryLine = ($Summary -replace '[\r\n]+', ' ').Trim()
Add-ChangelogEntry -Path (Join-Path $sourceRoot 'CHANGELOG.md') -Version $version -Text $summaryLine
foreach ($docsPath in @('docs\INSTALL-IIS-CS.md', 'docs\INSTALL-IIS-EN.md', 'README-IIS.txt')) {
    $path = Join-Path $sourceRoot $docsPath
    $contents = [IO.File]::ReadAllText($path)
    $contents = [regex]::Replace($contents, 'CAWeb-\d+\.\d+\.\d+-win-x64\.zip', "CAWeb-$version-win-x64.zip")
    [IO.File]::WriteAllText($path, $contents, [Text.UTF8Encoding]::new($false))
}

$toolsRoot = Join-Path $buildRoot 'tools'
$dotnetPath = Join-Path $toolsRoot 'dotnet\dotnet.exe'
$null = New-Item -ItemType Directory -Path $toolsRoot -Force
if (-not (Test-Path -LiteralPath $dotnetPath)) {
    $systemDotnet = Get-Command dotnet -ErrorAction SilentlyContinue
    $hasSdk10 = $false
    if ($systemDotnet) { $hasSdk10 = @(& $systemDotnet.Source --list-sdks | Where-Object { $_ -match '^10\.' }).Count -gt 0 }
    if ($hasSdk10) { $dotnetPath = $systemDotnet.Source }
    else {
        $installer = Join-Path $toolsRoot 'dotnet-install.ps1'
        Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile $installer
        & $installer -Channel 10.0 -InstallDir (Join-Path $toolsRoot 'dotnet') -Architecture x64 -NoPath
        if ($LASTEXITCODE -ne 0) { throw 'The .NET 10 SDK could not be installed into the build directory.' }
    }
}
if (-not (Test-Path -LiteralPath $dotnetPath)) { throw 'Install .NET 10 SDK before building CAWeb.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required for the JavaScript syntax check.' }

$env:DOTNET_CLI_HOME = Join-Path $buildRoot '.dotnet-home'
$env:NUGET_PACKAGES = Join-Path $buildRoot '.nuget\packages'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'

$objPath = Join-Path $buildRoot 'obj'
$binPath = Join-Path $buildRoot 'bin'
$publishPath = Join-Path $buildRoot 'publish'
$testsPath = Join-Path $buildRoot 'tests'
$packagePath = Join-Path $buildRoot 'package'
$artifactsPath = Join-Path $buildRoot 'artifacts'
foreach ($path in @($objPath, $binPath, $publishPath, $testsPath, $packagePath)) { Reset-BuildDirectory -Path $path }
$null = New-Item -ItemType Directory -Path $artifactsPath -Force

& node --check (Join-Path $sourceRoot 'wwwroot\app.js')
if ($LASTEXITCODE -ne 0) { throw 'JavaScript syntax validation failed.' }
$parseErrors = $null
$parseTokens = $null
$installerAst = [Management.Automation.Language.Parser]::ParseFile((Join-Path $sourceRoot 'Install-CAWeb.ps1'), [ref]$parseTokens, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) { throw "Install-CAWeb.ps1 has a PowerShell parse error: $($parseErrors[0].Message)" }
$packageSelectorAst = $installerAst.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Resolve-PackagePath' }, $true)
if ($null -eq $packageSelectorAst) { throw 'Install-CAWeb.ps1 is missing Resolve-PackagePath.' }
. ([scriptblock]::Create($packageSelectorAst.Extent.Text))
$selectorTestPath = Join-Path $testsPath 'package-selection'
$null = New-Item -ItemType Directory -Path $selectorTestPath -Force
foreach ($testVersion in @('0.1.9', '0.1.10', '0.1.8')) {
    $testZip = Join-Path $selectorTestPath "CAWeb-$testVersion-win-x64.zip"
    $null = New-Item -ItemType File -Path $testZip -Force
}
Push-Location -LiteralPath $selectorTestPath
try {
    $selectedPackage = Resolve-PackagePath
    if ([IO.Path]::GetFileName($selectedPackage) -ne 'CAWeb-0.1.10-win-x64.zip') {
        throw "The installer did not select the highest semantic package version. Selected: $selectedPackage"
    }
    $explicitPackage = Resolve-PackagePath -RequestedPath (Join-Path $selectorTestPath 'CAWeb-0.1.9-win-x64.zip')
    if ([IO.Path]::GetFileName($explicitPackage) -ne 'CAWeb-0.1.9-win-x64.zip') {
        throw 'The installer did not honor an explicit PackagePath override.'
    }
} finally { Pop-Location }
$parseErrors = $null
$parseTokens = $null
[void] [Management.Automation.Language.Parser]::ParseFile((Join-Path $sourceRoot 'tests\Smoke-Test.ps1'), [ref]$parseTokens, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) { throw "Smoke-Test.ps1 has a PowerShell parse error: $($parseErrors[0].Message)" }

$publishArguments = @(
    'publish', $projectPath, '--configuration', 'Release', '--runtime', 'win-x64', '--self-contained', 'true',
    '--output', $publishPath, '--verbosity', 'minimal',
    "-p:BaseIntermediateOutputPath=$objPath\",
    "-p:BaseOutputPath=$binPath\",
    "-p:MSBuildProjectExtensionsPath=$objPath\CAWeb\"
)
& $dotnetPath @publishArguments
if ($LASTEXITCODE -ne 0) { throw 'The self-contained Windows x64 publish failed.' }
$publishedConfigPath = Join-Path $publishPath 'web.config'
if (-not (Test-Path -LiteralPath $publishedConfigPath -PathType Leaf)) { throw 'The publish output is missing web.config.' }
[xml] $publishedConfig = [IO.File]::ReadAllText($publishedConfigPath)
$aspNetCoreNode = $publishedConfig.SelectSingleNode('/configuration/location/system.webServer/aspNetCore')
if ($null -eq $aspNetCoreNode) { $aspNetCoreNode = $publishedConfig.SelectSingleNode('/configuration/system.webServer/aspNetCore') }
if ($null -eq $aspNetCoreNode) { throw 'The published web.config has no ASP.NET Core handler node in its IIS configuration location.' }
$environmentVariablesNode = $aspNetCoreNode.SelectSingleNode('./environmentVariables')
if ($null -eq $environmentVariablesNode) {
    $environmentVariablesNode = $publishedConfig.CreateElement('environmentVariables')
    [void] $aspNetCoreNode.AppendChild($environmentVariablesNode)
}
$dataDirectoryNode = $environmentVariablesNode.SelectSingleNode('./environmentVariable[@name="CAWEB_DATA_DIR"]')
if ($null -eq $dataDirectoryNode) {
    $dataDirectoryNode = $publishedConfig.CreateElement('environmentVariable')
    $dataDirectoryNode.SetAttribute('name', 'CAWEB_DATA_DIR')
    [void] $environmentVariablesNode.AppendChild($dataDirectoryNode)
}
$dataDirectoryNode.SetAttribute('value', 'C:\ProgramData\CAWeb\data')
if ($dataDirectoryNode.GetAttribute('value') -ne 'C:\ProgramData\CAWeb\data') { throw 'The ASP.NET Core data-directory setting could not be written to web.config.' }

& (Join-Path $sourceRoot 'tests\Smoke-Test.ps1') -PublishPath $publishPath -BuildRoot $buildRoot
if ($LASTEXITCODE -ne 0) { throw 'The CAWeb integration smoke test failed.' }
& (Join-Path $sourceRoot 'tests\Smoke-Test.ps1') -PublishPath $publishPath -PathBase '/caweb' -BuildRoot $buildRoot
if ($LASTEXITCODE -ne 0) { throw 'The CAWeb IIS sub-application smoke test failed.' }

$manifest = [ordered]@{
    application = 'CAWeb'
    version = $version
    runtime = 'win-x64'
    builtAtUtc = [DateTime]::UtcNow.ToString('O')
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $packagePath 'caweb-release.json') -Encoding UTF8
Get-ChildItem -LiteralPath $publishPath -Force | Copy-Item -Destination $packagePath -Recurse -Force
foreach ($relative in @('Install-CAWeb.ps1', 'README.md', 'CHANGELOG.md', 'docs\INSTALL-IIS-CS.md', 'docs\INSTALL-IIS-EN.md', 'docs\OPERATIONS.md')) {
    $destination = Join-Path $packagePath $relative
    $null = New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force
    Copy-Item -LiteralPath (Join-Path $sourceRoot $relative) -Destination $destination -Force
}

$unsafePackageFiles = Get-ChildItem -LiteralPath $packagePath -Recurse -File | Where-Object {
    $_.Extension -in @('.pfx', '.p12', '.key', '.db') -or $_.FullName -match '\\(Podklady|data|keys)\\'
}
if ($unsafePackageFiles) { throw "The release package contains a local key, database or source artifact: $($unsafePackageFiles[0].Name)" }
$archivePath = Join-Path $artifactsPath "CAWeb-$version-win-x64.zip"
Compress-Archive -Path (Join-Path $packagePath '*') -DestinationPath $archivePath -CompressionLevel Optimal -Force
Copy-Item -LiteralPath (Join-Path $sourceRoot 'Install-CAWeb.ps1') -Destination (Join-Path $artifactsPath 'Install-CAWeb.ps1') -Force

Invoke-Git -Arguments @('add', '--all') | Out-Null
$staged = @(& git diff --cached --name-only)
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the staged release files.' }
if ($staged | Where-Object { $_ -match '(^|/|\\)Podklady(/|\\)|\.(pfx|p12|key|db)$' }) { throw 'A certificate key, local Podklady file or runtime database was staged. Unstage it and review .gitignore.' }
Invoke-Git -Arguments @('-c', 'core.whitespace=cr-at-eol', 'diff', '--cached', '--check') | Out-Null

$commitMessage = "release: CAWeb $version"
Invoke-Git -Arguments @('commit', '-m', $commitMessage) | Out-Null
Invoke-Git -Arguments @('push', 'origin', 'HEAD:main') | Out-Null
$localHead = (Invoke-Git -Arguments @('rev-parse', 'HEAD')).Trim()
$publishedHead = ((Invoke-Git -Arguments @('ls-remote', 'origin', 'refs/heads/main')) -split '\s+')[0]
if ($publishedHead -ne $localHead) { throw 'GitHub main does not point at the release commit after push.' }

Write-Host "CAWeb $version is built and published to main." -ForegroundColor Green
Write-Host "Build output: $buildRoot"
Write-Host "Release ZIP: $archivePath"
Write-Host "Commit: $localHead"

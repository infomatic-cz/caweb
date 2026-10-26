[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $PublishPath,

    [string] $PathBase = '',

    [string] $BuildRoot = 'C:\Temp\CAWeb-Build'
)

$ErrorActionPreference = 'Stop'
$BuildRoot = [IO.Path]::GetFullPath($BuildRoot)
$PublishPath = (Resolve-Path -LiteralPath $PublishPath).Path
if (-not $BuildRoot.StartsWith('C:\Temp\CAWeb-Build', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Smoke-test output must remain under C:\Temp\CAWeb-Build.'
}
if (-not (Test-Path -LiteralPath (Join-Path $PublishPath 'CAWeb.exe'))) {
    throw 'PublishPath must contain the published CAWeb.exe.'
}
if ($PathBase -and $PathBase -notmatch '^/[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*$') {
    throw 'PathBase must be a URL path such as /caweb.'
}
$PathBase = $PathBase.TrimEnd('/')

$testId = [guid]::NewGuid().ToString('N')
$testDirectory = Join-Path $BuildRoot "tests\run-$testId"
$testData = Join-Path $testDirectory 'data'
$logOut = Join-Path $testDirectory 'stdout.log'
$logErr = Join-Path $testDirectory 'stderr.log'
$null = New-Item -ItemType Directory -Path $testData -Force

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = ([Net.IPEndPoint] $listener.LocalEndpoint).Port
$listener.Stop()
$baseUrl = "http://127.0.0.1:$port"
$applicationUrl = "$baseUrl$PathBase"

function New-Client {
    $handler = [Net.Http.HttpClientHandler]::new()
    $handler.CookieContainer = [Net.CookieContainer]::new()
    $handler.UseCookies = $true
    $handler.AllowAutoRedirect = $false
    $client = [Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(25)
    return $client
}

function Invoke-JsonApi {
    param(
        [Parameter(Mandatory)][Net.Http.HttpClient] $Client,
        [Parameter(Mandatory)][string] $Method,
        [Parameter(Mandatory)][string] $Path,
        [object] $Body,
        [int[]] $ExpectedStatus = @(200),
        [switch] $OmitCsrf
    )
    $requestMessage = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::new($Method), "$applicationUrl$Path")
    if (-not $OmitCsrf) { $requestMessage.Headers.Add('X-CAWeb-Request', '1') }
    if ($null -ne $Body) {
        $json = ConvertTo-Json -InputObject $Body -Depth 12 -Compress
        $requestMessage.Content = [Net.Http.StringContent]::new($json, [Text.Encoding]::UTF8, 'application/json')
    }
    $response = $Client.SendAsync($requestMessage).GetAwaiter().GetResult()
    $bodyText = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $statusCode = [int] $response.StatusCode
    $requestMessage.Dispose()
    if ($ExpectedStatus -notcontains $statusCode) {
        throw "$Method $Path returned HTTP $statusCode; expected $($ExpectedStatus -join ', ')."
    }
    if ([string]::IsNullOrWhiteSpace($bodyText)) { return $null }
    try { return ConvertFrom-Json -InputObject $bodyText } catch { throw "$Method $Path returned an invalid JSON response." }
}

function Invoke-Download {
    param(
        [Parameter(Mandatory)][Net.Http.HttpClient] $Client,
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory)][object] $Body,
        [Parameter(Mandatory)][string] $OutputPath
    )
    $requestMessage = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Post, "$applicationUrl$Path")
    $requestMessage.Headers.Add('X-CAWeb-Request', '1')
    $json = ConvertTo-Json -InputObject $Body -Depth 12 -Compress
    $requestMessage.Content = [Net.Http.StringContent]::new($json, [Text.Encoding]::UTF8, 'application/json')
    $response = $Client.SendAsync($requestMessage).GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) { throw "POST $Path returned HTTP $([int]$response.StatusCode)." }
    $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    [IO.File]::WriteAllBytes($OutputPath, $bytes)
    $requestMessage.Dispose()
    $disposition = $response.Content.Headers.ContentDisposition
    if ($null -eq $disposition) { return '' }
    if (-not [string]::IsNullOrWhiteSpace($disposition.FileNameStar)) { return $disposition.FileNameStar }
    return $disposition.FileName
}

function Invoke-MultipartApi {
    param(
        [Parameter(Mandatory)][Net.Http.HttpClient] $Client,
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory)][System.Collections.IDictionary] $Fields,
        [Parameter(Mandatory)][object[]] $Files
    )
    $content = [Net.Http.MultipartFormDataContent]::new()
    foreach ($entry in $Fields.GetEnumerator()) {
        $value = [string] $entry.Value
        $content.Add([Net.Http.StringContent]::new($value), [string] $entry.Key)
    }
    foreach ($file in $Files) {
        $part = [Net.Http.ByteArrayContent]::new([byte[]] $file.Bytes)
        $part.Headers.ContentType = [Net.Http.Headers.MediaTypeHeaderValue]::new('application/octet-stream')
        $content.Add($part, [string] $file.Field, [string] $file.Name)
    }
    $requestMessage = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Post, "$applicationUrl$Path")
    $requestMessage.Headers.Add('X-CAWeb-Request', '1')
    $requestMessage.Content = $content
    $response = $Client.SendAsync($requestMessage).GetAwaiter().GetResult()
    $bodyText = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $statusCode = [int] $response.StatusCode
    $requestMessage.Dispose()
    if ($statusCode -ne 200) { throw "POST $Path multipart returned HTTP $statusCode." }
    return ConvertFrom-Json -InputObject $bodyText
}

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw $Message }
}

$previousData = $env:CAWEB_DATA_DIR
$previousEnvironment = $env:ASPNETCORE_ENVIRONMENT
$previousUrls = $env:ASPNETCORE_URLS
$previousPathBase = $env:CAWEB_TEST_PATH_BASE
$env:CAWEB_DATA_DIR = $testData
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = $baseUrl
if ($PathBase) { $env:CAWEB_TEST_PATH_BASE = $PathBase } else { Remove-Item Env:\CAWEB_TEST_PATH_BASE -ErrorAction SilentlyContinue }
$process = $null
$adminClient = New-Client
$registrationClient = New-Client
try {
    $process = Start-Process -FilePath (Join-Path $PublishPath 'CAWeb.exe') -WorkingDirectory $PublishPath `
        -WindowStyle Hidden -PassThru -RedirectStandardOutput $logOut -RedirectStandardError $logErr

    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($process.HasExited) { throw 'The application exited before its health endpoint became ready.' }
        try {
            $health = Invoke-RestMethod -Uri "$applicationUrl/health" -TimeoutSec 2
            if ($health.status -eq 'ok') { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    Assert-True $ready 'The application health endpoint did not become ready.'

    $homeResponse = $adminClient.GetAsync("$applicationUrl/").GetAwaiter().GetResult()
    Assert-True $homeResponse.IsSuccessStatusCode 'The web application shell did not load.'
    $html = $homeResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    Assert-True ($html.Contains('manifest.webmanifest')) 'The app manifest is not linked from the page.'
    $expectedBaseHref = if ($PathBase) { "$PathBase/" } else { '/' }
    Assert-True ($html.Contains("<base href=`"$expectedBaseHref`">")) 'The application shell did not render its IIS path base.'
    $manifest = $adminClient.GetAsync("$applicationUrl/manifest.webmanifest").GetAwaiter().GetResult()
    Assert-True $manifest.IsSuccessStatusCode 'The PWA manifest is not available.'
    $manifestText = $manifest.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    Assert-True ($manifestText.Contains('"start_url": "./"') -and $manifestText.Contains('"scope": "./"')) 'The PWA manifest is not scoped relatively to the IIS application.'
    $script = $adminClient.GetAsync("$applicationUrl/app.js").GetAwaiter().GetResult()
    Assert-True $script.IsSuccessStatusCode 'The client application script is not available under the IIS path base.'
    $style = $adminClient.GetAsync("$applicationUrl/styles.css").GetAwaiter().GetResult()
    Assert-True $style.IsSuccessStatusCode 'The application stylesheet is not available under the IIS path base.'
    $serviceWorker = $adminClient.GetAsync("$applicationUrl/service-worker.js").GetAwaiter().GetResult()
    Assert-True $serviceWorker.IsSuccessStatusCode 'The service worker is not available.'
    $serviceWorkerText = $serviceWorker.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if ($PathBase) { Assert-True ($serviceWorkerText.Contains("new URL('api/', APP_BASE_URL)")) 'The service worker API exclusion is not application scoped.' }

    $initial = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/status'
    Assert-True $initial.setupRequired 'The first-run wizard should appear on a new installation.'
    $csrf = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/register' -Body @{} -ExpectedStatus @(403) -OmitCsrf

    $adminPassword = ([guid]::NewGuid().ToString('N') + 'Aa7!')
    $caPassword = ([guid]::NewGuid().ToString('N') + 'Ca8!')
    $serverPassword = ([guid]::NewGuid().ToString('N') + 'Se9!')
    $keyPassword = ([guid]::NewGuid().ToString('N') + 'Ke6!')
    $setup = [ordered]@{
        fullName = 'CAWeb Test Administrator'
        email = 'admin@example.test'
        password = $adminPassword
        confirmPassword = $adminPassword
        language = 'en'
        smtpHost = ''
        smtpPort = 587
        smtpFrom = ''
        smtpUsername = ''
        smtpPassword = ''
        smtpUseTls = $true
    }
    $null = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/setup' -Body $setup
    $signedIn = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/me'
    Assert-True ($signedIn.username -eq 'admin' -and $signedIn.role -eq 'admin' -and $signedIn.language -eq 'en') 'First-run setup did not create the admin session.'

    $forbidden = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/servers' -Body @{} -ExpectedStatus @(400)
    Assert-True ($forbidden.error -eq 'invalid_server_name') 'The API did not return expected validation for an empty server.'

    $caInput = [ordered]@{
        commonName = 'CAWeb Smoke Root'
        country = 'CZ'
        state = 'Prague'
        locality = 'Prague'
        organization = 'CAWeb Test'
        organizationalUnit = 'QA'
        keyAlgorithm = 'RSA'
        rsaBits = 2048
        validDays = 365
        password = $caPassword
        confirmPassword = $caPassword
        confirmReplacement = $false
    }
    $ca = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/ca/generate' -Body $caInput
    Assert-True ($ca.authority.subject -like '*CAWeb Smoke Root*') 'The test CA subject was not persisted.'

    $serverInput = [ordered]@{
        name = 'smoke-iis'
        description = 'Automated integration scenario'
        serverType = 'IIS'
        commonName = 'localhost'
        country = 'CZ'
        state = 'Prague'
        locality = 'Prague'
        organization = 'CAWeb Test'
        organizationalUnit = 'QA'
        dnsNames = @('server.example.test')
        ipAddresses = @('127.0.0.1', '2001:db8::25')
        keyUsage = @('digitalSignature', 'keyEncipherment')
        keyAlgorithm = 'RSA'
        validDays = 30
    }
    $invalidIpInput = [ordered]@{}
    foreach ($key in $serverInput.Keys) { $invalidIpInput[$key] = $serverInput[$key] }
    $invalidIpInput['name'] = 'smoke-invalid-ip'
    $invalidIpInput['ipAddresses'] = @('not-an-ip')
    $invalidIp = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/servers' -Body $invalidIpInput -ExpectedStatus @(400)
    Assert-True ($invalidIp.error -eq 'invalid_ip_address') 'An invalid IP address did not return its specific validation error.'
    $server = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/servers' -Body $serverInput -ExpectedStatus @(201)
    Assert-True ($server.status -eq 'not-issued') 'A newly created server should have no certificate.'
    Assert-True ($server.dnsNames -contains 'localhost') 'The CN was not automatically added to DNS SAN.'

    $pfxPath = Join-Path $testDirectory 'server.pfx'
    $pfxName = Invoke-Download -Client $adminClient -Path "/api/servers/$($server.id)/issue" -Body @{ password = $serverPassword; confirmPassword = $serverPassword; reviewConfirmed = $true } -OutputPath $pfxPath
    Assert-True (Test-Path -LiteralPath $pfxPath) 'The issued server PFX was not written to the test directory.'
    $pfxBytes = [IO.File]::ReadAllBytes($pfxPath)
    $certificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new($pfxBytes, $serverPassword, [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
    Assert-True $certificate.HasPrivateKey 'The issued PFX has no server private key.'
    Assert-True ($certificate.Subject -like '*CN=localhost*') 'The issued certificate has the wrong subject.'
    $san = $certificate.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.17' } | Select-Object -First 1
    Assert-True ($null -ne $san -and $san.Format($true).Contains('server.example.test')) 'The issued certificate SAN does not contain the configured DNS name.'
    $sanBytes = [Convert]::ToHexString($san.RawData)
    Assert-True ($sanBytes.Contains('20010DB8000000000000000000000025')) 'The issued certificate SAN does not contain the configured IPv6 address.'
    $certificate.Dispose()
    $afterIssue = (Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/servers')[0]
    Assert-True ($afterIssue.status -eq 'expiring') 'The issued certificate status should reflect its 30-day validity window.'

    foreach ($format in @('pem', 'der', 'crt', 'p7b', 'p12')) {
        $path = Join-Path $testDirectory "server.$format"
        $password = if ($format -in @('p12')) { $serverPassword } else { '' }
        $null = Invoke-Download -Client $adminClient -Path "/api/servers/$($server.id)/export" -Body @{ format = $format; password = $password } -OutputPath $path
        Assert-True ((Get-Item -LiteralPath $path).Length -gt 100) "The server $format export is empty."
    }
    $pemPath = Join-Path $testDirectory 'server.pem'
    Assert-True ((Get-Content -LiteralPath $pemPath -Raw).StartsWith('-----BEGIN CERTIFICATE-----')) 'PEM export is not a certificate.'
    $keyPath = Join-Path $testDirectory 'server.key'
    $null = Invoke-Download -Client $adminClient -Path "/api/servers/$($server.id)/export" -Body @{ format = 'key'; password = $keyPassword } -OutputPath $keyPath
    Assert-True ((Get-Content -LiteralPath $keyPath -Raw).StartsWith('-----BEGIN ENCRYPTED PRIVATE KEY-----')) 'Private key export is not encrypted PKCS#8 PEM.'

    $caPfxPath = Join-Path $testDirectory 'ca.p12'
    $null = Invoke-Download -Client $adminClient -Path '/api/ca/export' -Body @{ format = 'p12'; password = $caPassword } -OutputPath $caPfxPath
    $caPfx = [Security.Cryptography.X509Certificates.X509Certificate2Collection]::new()
    $caPfx.Import([IO.File]::ReadAllBytes($caPfxPath), $caPassword, [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
    Assert-True (@($caPfx | Where-Object { $_.HasPrivateKey }).Count -eq 1) 'The CA backup P12 should include exactly one private key.'
    foreach ($item in $caPfx) { $item.Dispose() }

    $originalThumbprint = $ca.authority.thumbprint
    $caImported = Invoke-MultipartApi -Client $adminClient -Path '/api/ca/import' -Fields @{ mode = 'pfx'; password = $caPassword; confirmReplacement = 'true' } -Files @(@{ Field = 'pfxFile'; Name = 'ca.p12'; Bytes = [IO.File]::ReadAllBytes($caPfxPath) })
    Assert-True ($caImported.authority.thumbprint -eq $originalThumbprint) 'PFX import changed the CA certificate.'
    Assert-True ($caImported.authority.publicKeyFingerprint -eq $ca.authority.publicKeyFingerprint) 'Importing the same CA changed its public key fingerprint.'

    $caKeyPath = Join-Path $testDirectory 'ca.key'
    $null = Invoke-Download -Client $adminClient -Path '/api/ca/export' -Body @{ format = 'key'; password = $keyPassword } -OutputPath $caKeyPath
    $caPemPath = Join-Path $testDirectory 'ca.pem'
    $null = Invoke-Download -Client $adminClient -Path '/api/ca/export' -Body @{ format = 'pem'; password = '' } -OutputPath $caPemPath
    foreach ($format in @('der', 'crt', 'p7b')) {
        $path = Join-Path $testDirectory "ca.$format"
        $null = Invoke-Download -Client $adminClient -Path '/api/ca/export' -Body @{ format = $format; password = '' } -OutputPath $path
        Assert-True ((Get-Item -LiteralPath $path).Length -gt 100) "The CA $format export is empty."
    }
    $caImportedPair = Invoke-MultipartApi -Client $adminClient -Path '/api/ca/import' -Fields @{ mode = 'pair'; password = $keyPassword; confirmReplacement = 'true' } -Files @(
        @{ Field = 'certificateFile'; Name = 'ca.pem'; Bytes = [IO.File]::ReadAllBytes($caPemPath) },
        @{ Field = 'keyFile'; Name = 'ca.key'; Bytes = [IO.File]::ReadAllBytes($caKeyPath) }
    )
    Assert-True ($caImportedPair.authority.thumbprint -eq $originalThumbprint) 'PEM certificate/key import changed the CA certificate.'

    $registrationPassword = ([guid]::NewGuid().ToString('N') + 'Us5!')
    $registration = [ordered]@{ username = "smoke-$testId"; fullName = 'Smoke User'; email = 'smoke@example.test'; password = $registrationPassword; language = 'cs' }
    $null = Invoke-JsonApi -Client $registrationClient -Method POST -Path '/api/register' -Body $registration -ExpectedStatus @(202)
    $pendingLogin = Invoke-JsonApi -Client $registrationClient -Method POST -Path '/api/login' -Body @{ username = $registration.username; password = $registrationPassword } -ExpectedStatus @(403)
    Assert-True ($pendingLogin.error -eq 'approval_required') 'A pending registration was allowed to sign in.'
    $allUsers = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/users'
    $pendingUser = $allUsers | Where-Object { $_.username -eq $registration.username } | Select-Object -First 1
    Assert-True ($pendingUser.status -eq 'pending') 'The registration request was not stored as pending.'
    $null = Invoke-JsonApi -Client $adminClient -Method POST -Path "/api/users/$($pendingUser.id)/decision" -Body @{ decision = 'approve' }
    $activeLogin = Invoke-JsonApi -Client $registrationClient -Method POST -Path '/api/login' -Body @{ username = $registration.username; password = $registrationPassword }

    Assert-True ($activeLogin.user.status -eq 'active') 'The approved user could not sign in.'
    $userLogs = Invoke-JsonApi -Client $registrationClient -Method GET -Path '/api/logs' -ExpectedStatus @(403)
    $language = Invoke-JsonApi -Client $registrationClient -Method PUT -Path '/api/me/language' -Body @{ language = 'en' }
    Assert-True ($language.language -eq 'en') 'A user could not save a personal language preference.'
    $tomcatInput = [ordered]@{}
    foreach ($key in $serverInput.Keys) { $tomcatInput[$key] = $serverInput[$key] }
    $tomcatInput['name'] = 'smoke-tomcat'
    $tomcatInput['serverType'] = 'Tomcat'
    $newServer = Invoke-JsonApi -Client $registrationClient -Method POST -Path '/api/servers' -Body $tomcatInput -ExpectedStatus @(201)
    Assert-True ($newServer.serverType -eq 'Tomcat') 'An approved user could not manage server records.'

    $disabled = Invoke-JsonApi -Client $adminClient -Method PUT -Path "/api/users/$($pendingUser.id)" -Body @{ fullName = 'Smoke User'; email = 'smoke@example.test'; language = 'en'; role = 'user'; status = 'disabled'; password = $null }
    $revoked = Invoke-JsonApi -Client $registrationClient -Method GET -Path '/api/me' -ExpectedStatus @(401)

    $smtpPassword = ([guid]::NewGuid().ToString('N') + 'Sm4!')
    $savedSettings = Invoke-JsonApi -Client $adminClient -Method PUT -Path '/api/settings' -Body @{
        host = '127.0.0.1'; port = 1; fromAddress = 'caweb@example.test'; username = 'smtp-user'; password = $smtpPassword; useTls = $true; registrationEnabled = $true
    }
    $settings = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/settings'
    Assert-True ($savedSettings.smtpConfigured -and $settings.smtp.passwordSet) 'SMTP settings did not persist.'
    Assert-True (-not ($settings.smtp.PSObject.Properties.Name -contains 'password')) 'The SMTP password was returned by the settings API.'
    $failedEmail = Invoke-JsonApi -Client $adminClient -Method POST -Path '/api/settings/test-email' -Body @{ recipient = 'admin@example.test' } -ExpectedStatus @(500)
    Assert-True ($failedEmail.referenceId -match '^[A-F0-9]{12}$') 'An unexpected server error did not return a reference ID.'
    $operationalLogs = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/logs'
    $loggedFailure = $operationalLogs | Where-Object { $_.referenceId -eq $failedEmail.referenceId } | Select-Object -First 1
    Assert-True ($null -ne $loggedFailure -and $loggedFailure.exceptionDetails) 'The server error was not available in the administrator log viewer.'
    Assert-True (-not ((ConvertTo-Json $operationalLogs -Depth 10) -match [regex]::Escape($smtpPassword))) 'The SMTP password was written to operational logs.'
    Stop-Process -Id $process.Id -Force
    $process.WaitForExit()
    $databaseBytes = [IO.File]::ReadAllBytes((Join-Path $testData 'caweb.db'))
    $databaseText = [Text.Encoding]::ASCII.GetString($databaseBytes)
    Assert-True (-not $databaseText.Contains($smtpPassword)) 'The SMTP password appears in plaintext in the SQLite file.'

    $restartLogOut = Join-Path $testDirectory 'restart-stdout.log'
    $restartLogErr = Join-Path $testDirectory 'restart-stderr.log'
    $process = Start-Process -FilePath (Join-Path $PublishPath 'CAWeb.exe') -WorkingDirectory $PublishPath `
        -WindowStyle Hidden -PassThru -RedirectStandardOutput $restartLogOut -RedirectStandardError $restartLogErr
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($process.HasExited) { throw 'The application exited during the restart persistence check.' }
        try {
            $health = Invoke-RestMethod -Uri "$applicationUrl/health" -TimeoutSec 2
            if ($health.status -eq 'ok') { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    Assert-True $ready 'The application did not become ready after restart.'
    $persistedUser = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/me'
    Assert-True ($persistedUser.username -eq 'admin') 'The admin session did not survive an application restart.'
    $persistedSettings = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/settings'
    Assert-True ($persistedSettings.smtp.passwordSet -and $persistedSettings.registrationEnabled) 'SMTP and registration settings did not survive an application restart.'
    $persistedLogs = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/logs'
    Assert-True (($persistedLogs | Where-Object { $_.referenceId -eq $failedEmail.referenceId }) -ne $null) 'Operational logs did not survive an application restart.'
    $persistedServers = Invoke-JsonApi -Client $adminClient -Method GET -Path '/api/servers'
    Assert-True ($persistedServers.Count -eq 2) 'Server records did not survive an application restart.'
    $persistedServerPfx = Join-Path $testDirectory 'server-after-restart.pfx'
    $null = Invoke-Download -Client $adminClient -Path "/api/servers/$($server.id)/export" -Body @{ format = 'pfx'; password = $serverPassword } -OutputPath $persistedServerPfx
    Assert-True ((Get-Item -LiteralPath $persistedServerPfx).Length -gt 100) 'A protected certificate key could not be used after restart.'

    Assert-True ((Get-Content -LiteralPath $caPemPath -Raw).StartsWith('-----BEGIN CERTIFICATE-----')) 'CA PEM export is invalid.'

    $pathDescription = if ($PathBase) { $PathBase } else { '/' }
    Write-Output "PASS: $pathDescription path base, app shell/PWA assets, setup, authentication, CSRF gate, CA generation and both import formats, IPv4/IPv6 SAN issuance, protected operational logs, all exports, registration approval, user access control, SMTP secrecy, restart persistence and protected-key recovery."
} catch {
    if (Test-Path -LiteralPath $logErr) {
        $logTail = Get-Content -LiteralPath $logErr -Tail 40 -ErrorAction SilentlyContinue
        if ($logTail) { Write-Output 'Application diagnostic log:'; $logTail }
    }
    throw
} finally {
    $adminClient.Dispose()
    $registrationClient.Dispose()
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        $process.WaitForExit()
    }
    if ($null -eq $previousData) { Remove-Item Env:\CAWEB_DATA_DIR -ErrorAction SilentlyContinue } else { $env:CAWEB_DATA_DIR = $previousData }
    if ($null -eq $previousEnvironment) { Remove-Item Env:\ASPNETCORE_ENVIRONMENT -ErrorAction SilentlyContinue } else { $env:ASPNETCORE_ENVIRONMENT = $previousEnvironment }
    if ($null -eq $previousUrls) { Remove-Item Env:\ASPNETCORE_URLS -ErrorAction SilentlyContinue } else { $env:ASPNETCORE_URLS = $previousUrls }
    if ($null -eq $previousPathBase) { Remove-Item Env:\CAWEB_TEST_PATH_BASE -ErrorAction SilentlyContinue } else { $env:CAWEB_TEST_PATH_BASE = $previousPathBase }
    if (Test-Path -LiteralPath $testDirectory) { Remove-Item -LiteralPath $testDirectory -Recurse -Force }
}

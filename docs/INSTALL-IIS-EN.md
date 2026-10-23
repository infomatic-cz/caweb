# Installing CAWeb on Windows IIS

This procedure targets a single Windows Server instance. The application is published as a self-contained `win-x64` deployment, so a separate .NET runtime is not needed. IIS still needs the ASP.NET Core Module installed by the .NET 10 Hosting Bundle.

## 1. Prepare the server

1. Install **IIS** with the Web Server role, Static Content, and IIS Management Tools.
2. Install the current **.NET 10 Hosting Bundle** from [Microsoft .NET 10 downloads](https://dotnet.microsoft.com/download/dotnet/10.0). Restart IIS or the server afterward.
3. Prepare a DNS name for the admin site, for example `caweb.intranet.example`.
4. Import a TLS certificate **for the CAWeb admin site** into `Cert:\LocalMachine\My`, including its private key. This IIS binding certificate is separate from the CA managed by the application.
5. Copy the release ZIP and `Install-IIS.ps1` from `C:\Temp\CAWeb-Build\artifacts` to the server, for example `C:\Transfer`.

## 2. Install the application

Open PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
Set-Location C:\Transfer
./Install-IIS.ps1 `
  -PackagePath C:\Transfer\CAWeb-0.1.1-win-x64.zip `
  -HostName caweb.intranet.example `
  -HttpsCertificateThumbprint 'REPLACE_WITH_TLS_CERTIFICATE_THUMBPRINT'
```

The installer creates an `ApplicationPoolIdentity` pool named `CAWeb`, an HTTPS SNI binding, the required IIS Hosting Module, the data folder `C:\ProgramData\CAWeb\data`, and the necessary ACLs. It does not expose the site over HTTP. Optional parameters are `-SiteName`, `-AppPoolName`, `-SiteRoot`, `-DataPath`, and `-HttpsPort`.

Check the site and health endpoint:

```powershell
Get-Website -Name CAWeb
Get-WebAppPoolState -Name CAWeb
Invoke-RestMethod https://caweb.intranet.example/health
```

For an internal TLS certificate, distribute its trust chain to the client computers that open the admin site.

## 3. Complete first-run setup

1. Open `https://caweb.intranet.example`.
2. Enter the administrator's name, email, language, and a strong password for `admin` (at least 14 characters).
3. Enter the SMTP host, port, sender address and credentials, or skip SMTP. Local management works without SMTP; registration notifications will not be sent.
4. Finish setup and sign in as the administrator.

## 4. Preserve your existing CA

1. Open **Certificate authority → Import existing CA**.
2. Choose either an existing CA PFX/P12 and its password, or the public PEM/DER certificate together with its matching PEM private key.
3. Enter the key password for an encrypted PEM. Leave it blank for an unencrypted PEM.
4. Verify the imported subject, fingerprint and validity. The original public certificate is retained; its private key is encrypted in the application database.

Files in `Podklady\` are not copied into the deployment or GitHub. Select them directly in the administrator's browser.

## 5. Issue and install certificates

1. In **Servers and certificates**, add a server and enter its CN, DN, DNS/IP SANs, KeyUsage, target server type and validity.
2. Review the values before issuance and confirm the review checkbox.
3. Choose a password for the downloaded PFX (IIS) or P12 (Tomcat). CAWeb never stores this password.
4. IIS: import the PFX into Local Computer\Personal and assign it to the target site's HTTPS binding.
5. Tomcat: import the P12 into its keystore and configure the connector. Use the password chosen when issuing the certificate.
6. Distribute the public CA certificate to clients and servers according to your infrastructure. P7B includes the public certificate chain.

## 6. Updates

Extract each release into a new directory under `C:\inetpub\CAWeb\releases\<version>` and keep the previous release. Change the IIS Physical Path only after checking the new package. Keep `C:\ProgramData\CAWeb\data` and the Data Protection keys in place. The previous release folder supports a binary rollback.

## 7. Security and backups

- Restrict access to the administration network and use HTTPS only.
- Back up SQLite, Windows DPAPI/Data Protection keys and the separate CA PFX/P12 as described in the [operations guide](OPERATIONS.md).
- Keep Windows Server, IIS and the .NET Hosting Bundle patched.
- Never place passwords or keys in scripts, tickets or URLs.
- After CA rotation, renew server certificates and redistribute the new root certificate. Follow the [CA rotation procedure](OPERATIONS.md#rotace-ca).

## Requirements

- Windows Server x64 with IIS.
- .NET 10 Hosting Bundle and ANCM V2.
- An existing TLS server certificate with its private key for the CAWeb HTTPS site.
- Writable storage outside the application directory for SQLite and backups.

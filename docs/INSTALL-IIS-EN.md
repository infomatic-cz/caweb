# Install CAWeb under `/caweb` on an existing IIS site

CAWeb is installed as a separate IIS sub-application under an existing website, for example `https://<server>/caweb/`. It reuses the HTTPS configuration already used by IIS. The installer does not create a website or change its root application, hostname, port, TLS binding, or certificate.

## Requirements

- A running IIS website with HTTPS already configured.
- 64-bit PowerShell 7, run as Administrator.
- IIS Management Scripts and Tools (AppCmd and Microsoft.Web.Administration).
- ASP.NET Core Module V2 from the .NET 10 Hosting Bundle. If other ASP.NET Core apps already run on IIS, the Hosting Bundle is usually installed. The installer reports any missing components.

## Install

1. Copy the current `CAWeb-<version>-win-x64.zip` and `Install-CAWeb.ps1` from `C:\Temp\CAWeb-Build\artifacts` into one folder on the server, for example `C:\Transfer`.
2. Open 64-bit PowerShell 7 (`pwsh.exe`) **as Administrator**, change to that folder, and run the script without arguments:

```powershell
Set-Location C:\Transfer
.\Install-CAWeb.ps1
```

With no arguments, the script selects the ZIP with the highest version in the current folder, uses the existing IIS website `Default Web Site`, and installs to `C:\Apps\CAWeb`. The website name is not a URL or hostname. Keep the ZIP and script in the same folder and run the command from that folder.

To use a different IIS website or folder, override the defaults:

```powershell
.\Install-CAWeb.ps1 -SiteName 'IIS website name' -InstallRoot 'D:\Apps\CAWeb'
```

To select a different ZIP explicitly, pass `-PackagePath 'C:\path\CAWeb-0.1.7-win-x64.zip'`. The installer extracts the version to `C:\Apps\CAWeb\releases\<version>`, creates a dedicated `CAWeb` application pool with `ApplicationPoolIdentity`, and attaches it to the existing website as `/caweb`. The database and keys are stored outside the website in `%ProgramData%\CAWeb\data`, with a restricted ACL for the pool identity, SYSTEM, and Windows administrators.

For a new installation, you can optionally set the pool identity with `-ServiceAccount 'DOMAIN\user'`. The installer prompts for the password securely; don't put it on the command line. During upgrades, it preserves the current identity. Use `-UseApplicationPoolIdentity` to explicitly switch back to the IIS application pool identity.

The installer leaves the root website, HTTPS binding, certificate, and other applications unchanged. CAWeb does not need the server name; open the existing website using its current host and append `/caweb/`.

After installation, open `https://<same-host-as-the-parent-website>/caweb/`. Check availability with:

```powershell
Invoke-RestMethod https://<same-host-as-the-parent-website>/caweb/health
```

## First run

1. Open `/caweb/` in a browser on the existing HTTPS website.
2. The setup wizard creates the `admin` account and asks for a name, email, personal language, and a password of at least 14 characters.
3. Configure SMTP if needed; it can be added later.
4. After sign-in, open **Certificate authority → Import existing CA** and select your existing CA PFX/P12 or its certificate and private PEM key. You don't need to copy files from `Podklady` to the server; select them in the browser on your computer.

## Update

Copy the newer ZIP and `Install-CAWeb.ps1` into the same current folder on the server and run `.\Install-CAWeb.ps1` again from 64-bit PowerShell 7 as Administrator. It selects the highest ZIP version, adds a new versioned release folder, and switches only `/caweb` to it. The database, Data Protection keys, parent website, HTTPS binding, and other applications are preserved. Keep previous release folders for rollback.

## Backup and restore

Back up the complete `%ProgramData%\CAWeb\data` folder, including the SQLite database and `keys` directory, and keep a CA PFX/P12 export separately. See the [operations guide](OPERATIONS.md). When restoring the application, attach it again under `/caweb` on the same existing IIS website.

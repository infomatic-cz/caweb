# Install CAWeb under `/caweb` on an existing IIS site

CAWeb is attached as an IIS **sub-application** at `https://<existing-host>/caweb/`. It uses HTTPS and the certificate already configured on the parent IIS site. The installer does not create a website or change the hostname, port, TLS binding, certificate, or root application.

## Requirements

- A running IIS website with its HTTPS binding already configured.
- The ASP.NET Core Module for .NET 10 (included in the .NET 10 Hosting Bundle). If other ASP.NET Core apps already run on this IIS server, the module is usually installed. The installer checks for it.
- Administrator rights on the server.

## Install

1. Copy `CAWeb-0.1.3-win-x64.zip` and `Install-IIS.ps1` from `C:\Temp\CAWeb-Build\artifacts` to the server, for example `C:\Transfer`.
2. Open PowerShell **as Administrator** and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
Set-Location C:\Transfer
.\Install-IIS.ps1 -PackagePath C:\Transfer\CAWeb-0.1.3-win-x64.zip
```

The installer automatically selects the only running IIS website with an existing HTTPS binding. If IIS has more than one, specify the target **website name shown in IIS Manager**. This is not a URL or hostname:

```powershell
.\Install-IIS.ps1 `
  -PackagePath C:\Transfer\CAWeb-0.1.3-win-x64.zip `
  -SiteName 'Name of the existing IIS website'
```

The installer extracts the version to `C:\inetpub\CAWeb\releases\<version>`, creates a dedicated `CAWeb` application pool with `ApplicationPoolIdentity`, and attaches it to the existing website as the `/caweb` application. The database and keys are stored outside the website in `%ProgramData%\CAWeb\data`, with a restricted ACL for the app pool, SYSTEM, and Windows administrators.

The parent website, its applications and bindings are left in place. CAWeb does not ask for or store the server name, port, or HTTPS certificate. Browsers use the existing website address and its TLS configuration.

After installation, open:

```text
https://<same-host-as-the-parent-website>/caweb/
```

Check availability with:

```powershell
Invoke-RestMethod https://<same-host-as-the-parent-website>/caweb/health
```

## First run

1. Open the `/caweb/` address above in a browser.
2. The setup wizard creates the `admin` account and asks for a name, email, personal language, and a password of at least 14 characters.
3. Configure SMTP if needed; it can be added later.
4. After sign-in, open **Certificate authority → Import existing CA** and select your existing CA PFX/P12 or its certificate and private PEM key. You don't need to copy files from `Podklady` to the server; select them in the browser on your computer.

## Update

Copy the newer ZIP and `Install-IIS.ps1` to the server and run `Install-IIS.ps1 -PackagePath ...` again. The installer adds a new versioned release folder and switches only the `/caweb` application to it. The database, Data Protection keys, parent website, HTTPS binding, and other applications are preserved. Keep previous release folders for rollback.

## Backup and restore

Back up the complete `%ProgramData%\CAWeb\data` folder, including the SQLite database and `keys` directory, and keep a CA PFX/P12 export separately. See the [operations guide](OPERATIONS.md). When restoring the application, attach it again under `/caweb` on the same existing IIS website.

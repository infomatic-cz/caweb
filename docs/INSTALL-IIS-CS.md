# Nasazení CAWeb na Windows IIS

Postup je určen pro jednu instanci Windows Serveru. Aplikace je publikována jako self-contained `win-x64`; samostatná instalace .NET runtime tedy není nutná, ale IIS musí mít ASP.NET Core Module z .NET 10 Hosting Bundle.

## 1. Připravte server

1. Nainstalujte **IIS** s rolí Web Server, Static Content a IIS Management Tools.
2. Nainstalujte aktuální **.NET 10 Hosting Bundle**: [Microsoft .NET 10 download](https://dotnet.microsoft.com/download/dotnet/10.0). Po instalaci restartujte IIS nebo server.
3. Připravte DNS jméno pro administrační web, například `caweb.intranet.example`.
4. Do úložiště `Cert:\LocalMachine\My` importujte TLS certifikát **pro webové rozhraní CAWeb** včetně privátního klíče. Tento binding certifikát je nezávislý na CA, kterou aplikace spravuje.
5. Zkopírujte release ZIP a `Install-IIS.ps1` z `C:\Temp\CAWeb-Build\artifacts` na server, například do `C:\Transfer`.

## 2. Nainstalujte aplikaci

Spusťte PowerShell jako správce:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
Set-Location C:\Transfer
./Install-IIS.ps1 `
  -PackagePath C:\Transfer\CAWeb-0.1.1-win-x64.zip `
  -HostName caweb.intranet.example `
  -HttpsCertificateThumbprint 'VLOŽTE_OTISK_TLS_CERTIFIKÁTU'
```

Skript vytvoří pool `CAWeb` s `ApplicationPoolIdentity`, HTTPS binding se SNI, vyžadovaný IIS Hosting Module, datovou složku `C:\ProgramData\CAWeb\data` a ACL pro aplikační pool. Aplikace nebude vystavena přes HTTP. Volitelné parametry jsou `-SiteName`, `-AppPoolName`, `-SiteRoot`, `-DataPath` a `-HttpsPort`.

Ověřte službu a health endpoint:

```powershell
Get-Website -Name CAWeb
Get-WebAppPoolState -Name CAWeb
Invoke-RestMethod https://caweb.intranet.example/health
```

Při použití interního TLS certifikátu přidejte jeho řetězec důvěry do klientů, které web otevřou.

## 3. Dokončete první spuštění

1. Otevřete `https://caweb.intranet.example`.
2. Zadejte jméno, e-mail, jazyk a silné heslo pro uživatele `admin` (minimálně 14 znaků).
3. Vyplňte SMTP host, port, odesílatele a přihlašovací údaje, nebo SMTP přeskočte. Bez SMTP zůstává lokální správa funkční; upozornění na nové žádosti se nebudou odesílat.
4. Zvolte Dokončit a přihlaste se vytvořeným správcem.

## 4. Zachovejte stávající CA

1. Otevřete **Certifikační autorita → Importovat existující CA**.
2. Zvolte buď existující CA PFX/P12 a zadejte jeho heslo, nebo veřejný certifikát PEM/DER spolu s odpovídajícím soukromým klíčem PEM.
3. Pokud je PEM klíč šifrovaný, zadejte jeho heslo. U nešifrovaného PEM nechte pole prázdné.
4. Ověřte subjekt, otisk a platnost importované CA. Původní veřejný certifikát se zachová; její soukromý klíč je v databázi zašifrovaný Data Protection.

Soubory z `Podklady\` se do balíčku ani GitHubu nekopírují. Vyberte je přímo v prohlížeči na počítači správce.

## 5. Vytvářejte a instalujte certifikáty

1. V části **Servery a certifikáty** přidejte server a vyplňte CN, DN, DNS/IP SAN, KeyUsage, typ cílového serveru a požadovanou platnost.
2. Před vydáním znovu zkontrolujte parametry a zaškrtněte potvrzení revize.
3. Zvolte heslo chránící stažený PFX (IIS) nebo P12 (Tomcat). CAWeb toto heslo neukládá.
4. IIS: importujte PFX do úložiště Local Computer\Personal a přiřaďte certifikát k HTTPS bindingu cílového webu.
5. Tomcat: importujte P12 do keystore a nakonfigurujte příslušný connector. Heslo je stejné, jaké jste zadali při vydání.
6. Distribuujte veřejný CA certifikát klientům a serverům podle vaší infrastruktury. P7B obsahuje veřejný řetězec certifikátů.

## 6. Aktualizace

Vydání nové verze rozbalte do nového adresáře `C:\inetpub\CAWeb\releases\<verze>`; stávající release nemažte. Aktualizujte Physical Path webu až po ověření nového balíčku a ponechte `C:\ProgramData\CAWeb\data` i Data Protection klíče beze změny. Historické složky lze použít k návratu na předchozí binárky.

## 7. Bezpečnost a zálohy

- Přístup omezte na administrační síť a používejte pouze HTTPS.
- Zálohujte SQLite, Windows DPAPI/Data Protection klíče a oddělený CA PFX/P12 podle [provozního postupu](OPERATIONS.md).
- Udržujte Windows Server, IIS a .NET Hosting Bundle aktualizované.
- Nezapisujte hesla ani klíče do skriptů, ticketů nebo URL.
- Při obnově CA obnovte certifikáty serverů a důvěru kořenového certifikátu; postup [rotace CA](OPERATIONS.md#rotace-ca).

## Požadavky

- Windows Server x64 a IIS.
- .NET 10 Hosting Bundle s ANCM V2.
- Existující TLS serverový certifikát s privátním klíčem pro HTTPS administrační web.
- Zapisovatelný prostor mimo aplikační adresář pro SQLite a zálohy.

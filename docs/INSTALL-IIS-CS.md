# Nasazení CAWeb pod `/caweb` na existující IIS

CAWeb se instaluje jako samostatná IIS podaplikace pod již běžící web, například `https://<server>/caweb/`. Připojí se k HTTPS nastavení, které už IIS používá. Skript nevytváří IIS web a nemění jeho kořenovou aplikaci, hostname, port, TLS binding ani certifikát.

## Požadavky

- Běžící IIS web s nakonfigurovaným HTTPS bindingem.
- 64bitový PowerShell 7 spuštěný jako správce.
- IIS Management Scripts and Tools (AppCmd a Microsoft.Web.Administration).
- ASP.NET Core Module V2 z .NET 10 Hosting Bundle. Pokud na IIS již běží jiné ASP.NET Core aplikace, Hosting Bundle je obvykle nainstalovaný. Instalátor chybějící komponenty oznámí.

## Instalace

1. Zkopírujte `CAWeb-0.1.4-win-x64.zip` a `Install-CAWeb.ps1` z `C:\Temp\CAWeb-Build\artifacts` na server, například do `C:\Transfer`.
2. Otevřete 64bitový PowerShell 7 (`pwsh.exe`) **jako správce** a spusťte:

```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Transfer\Install-CAWeb.ps1 `
  -PackagePath C:\Transfer\CAWeb-0.1.4-win-x64.zip `
  -InstallRoot C:\inetpub\CAWeb
```

Pokud je na IIS jediný spuštěný web s HTTPS, instalátor jej vybere automaticky. Pokud je jich více, přidejte `-SiteName` s názvem cílového webu z IIS Manageru. Jde o název webu v IIS, nikoli o URL nebo hostname:

```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Transfer\Install-CAWeb.ps1 `
  -PackagePath C:\Transfer\CAWeb-0.1.4-win-x64.zip `
  -InstallRoot C:\inetpub\CAWeb `
  -SiteName 'Název existujícího webu v IIS'
```

Instalátor rozbalí verzi do `C:\inetpub\CAWeb\releases\<verze>`, vytvoří samostatný pool `CAWeb` s identitou `ApplicationPoolIdentity` a připojí jej k existujícímu webu jako aplikaci `/caweb`. Databázi a klíče ukládá mimo web do `%ProgramData%\CAWeb\data` s omezeným ACL pro identitu poolu, SYSTEM a správce Windows.

Volitelně lze pro novou instalaci nastavit identitu poolu parametrem `-ServiceAccount 'DOMENA\uzivatel'`. Heslo se vyžádá skrytým vstupem; nezadávejte ho do příkazové řádky. Při aktualizaci se aktuální identita zachová. Parametrem `-UseApplicationPoolIdentity` ji lze výslovně přepnout zpět na identitu poolu IIS.

Kořenový web, HTTPS binding, certifikát ani ostatní aplikace instalátor nemění. Název serveru se do aplikace nezadává; prohlížeč otevře stejný host jako kořenový web a připojí cestu `/caweb/`.

Po instalaci otevřete `https://<stejný-host-jako-kořenový-web>/caweb/`. Dostupnost lze ověřit:

```powershell
Invoke-RestMethod https://<stejný-host-jako-kořenový-web>/caweb/health
```

## První spuštění

1. Otevřete v prohlížeči adresu `/caweb/` na existujícím HTTPS webu.
2. Průvodce vytvoří účet `admin` a vyžádá jméno, e-mail, osobní jazyk a heslo o délce alespoň 14 znaků.
3. SMTP nastavte podle potřeby; lze jej doplnit později.
4. Po přihlášení otevřete **Certifikační autorita → Importovat existující CA** a vyberte dosavadní CA PFX/P12 nebo certifikát a soukromý klíč PEM. Soubory z `Podklady` není třeba kopírovat na server; vyberte je v prohlížeči na svém počítači.

## Aktualizace

Zkopírujte novější ZIP a `Install-CAWeb.ps1` na server a spusťte stejný příkaz z 64bitového PowerShellu 7 jako správce. Instalátor přidá novou verzovanou složku a přepne na ni pouze aplikaci `/caweb`. Databáze, Data Protection klíče, kořenový web, HTTPS binding i ostatní aplikace zůstanou zachované. Starší release složky ponechte pro návrat.

## Zálohování a obnova

Zálohujte celý `%ProgramData%\CAWeb\data` včetně SQLite databáze a složky `keys`, plus oddělený export CA PFX/P12. Podrobnosti jsou v [provozním postupu](OPERATIONS.md). Při obnově aplikaci opět připojte pod `/caweb` na stejném existujícím IIS webu.

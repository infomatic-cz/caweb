# Nasazení CAWeb pod `/caweb` na existující IIS

CAWeb se instaluje jako samostatná IIS podaplikace pod již běžící web, například `https://<server>/caweb/`. Připojí se k HTTPS nastavení, které už IIS používá. Skript nevytváří IIS web a nemění jeho kořenovou aplikaci, hostname, port, TLS binding ani certifikát.

## Požadavky

- Běžící IIS web s nakonfigurovaným HTTPS bindingem.
- 64bitový PowerShell 7 spuštěný jako správce.
- IIS Management Scripts and Tools (AppCmd a Microsoft.Web.Administration).
- ASP.NET Core Module V2 z .NET 10 Hosting Bundle. Pokud na IIS již běží jiné ASP.NET Core aplikace, Hosting Bundle je obvykle nainstalovaný. Instalátor chybějící komponenty oznámí.

## Instalace

1. Zkopírujte aktuální `CAWeb-<verze>-win-x64.zip` a `Install-CAWeb.ps1` z `C:\Temp\CAWeb-Build\artifacts` do jedné složky na serveru, například `C:\Transfer`.
2. Otevřete 64bitový PowerShell 7 (`pwsh.exe`) **jako správce**, přejděte do složky se soubory a spusťte skript bez parametrů:

```powershell
Set-Location C:\Transfer
.\Install-CAWeb.ps1
```

Bez parametrů skript vybere ZIP s nejvyšší verzí v aktuální složce, použije existující IIS web `Default Web Site` a cílovou složku `C:\Apps\CAWeb`. Název webu není URL ani hostname. ZIP a skript proto před spuštěním umístěte do stejné složky a spusťte příkaz v ní.

Pokud chcete jiný IIS web nebo složku, můžete výchozí hodnoty přepsat:

```powershell
.\Install-CAWeb.ps1 -SiteName 'Název webu v IIS' -InstallRoot 'D:\Apps\CAWeb'
```

Pro jiný ZIP lze také použít `-PackagePath 'C:\cesta\CAWeb-0.1.12-win-x64.zip'`. Instalátor rozbalí verzi do `C:\Apps\CAWeb\releases\<verze>`, vytvoří samostatný pool `CAWeb` s identitou `ApplicationPoolIdentity` a připojí jej k existujícímu webu jako aplikaci `/caweb`. Databázi a klíče ukládá mimo web do `%ProgramData%\CAWeb\data` s omezeným ACL pro identitu poolu, SYSTEM a správce Windows.

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

Zkopírujte novější ZIP a `Install-CAWeb.ps1` do aktuální složky na serveru a spusťte `.\Install-CAWeb.ps1` z 64bitového PowerShellu 7 jako správce. Skript automaticky vybere nejvyšší verzi ZIPu, přidá novou verzovanou složku a přepne na ni pouze aplikaci `/caweb`. Databáze, Data Protection klíče, kořenový web, HTTPS binding i ostatní aplikace zůstanou zachované. Starší release složky ponechte pro návrat.

## Zálohování a obnova

Zálohujte celý `%ProgramData%\CAWeb\data` včetně SQLite databáze a složky `keys`, plus oddělený export CA PFX/P12. Podrobnosti jsou v [provozním postupu](OPERATIONS.md). Při obnově aplikaci opět připojte pod `/caweb` na stejném existujícím IIS webu.

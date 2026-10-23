# Nasazení CAWeb pod `/caweb` na existující IIS

CAWeb se připojí jako samostatná **IIS podaplikace** na adresu `https://<stávající-host>/caweb/`. Využije HTTPS a certifikát kořenového webu, který už na IIS běží. Instalační skript nezakládá nový web, nemění hostname, port, TLS binding, certifikát ani aplikaci v kořenové cestě.

## Co je potřeba

- Běžící IIS web, který má již nakonfigurovaný HTTPS binding.
- ASP.NET Core Module pro .NET 10 (součást .NET 10 Hosting Bundle). Pokud na stejném IIS běží jiné ASP.NET Core aplikace, modul je obvykle již nainstalován. Skript tuto podmínku ověří.
- Správcovské oprávnění na serveru.

## Instalace

1. Zkopírujte `CAWeb-0.1.3-win-x64.zip` a `Install-IIS.ps1` z `C:\Temp\CAWeb-Build\artifacts` na server, například do `C:\Transfer`.
2. Otevřete PowerShell **jako správce** a spusťte:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
Set-Location C:\Transfer
.\Install-IIS.ps1 -PackagePath C:\Transfer\CAWeb-0.1.3-win-x64.zip
```

Skript automaticky vybere jediný spuštěný IIS web s existujícím HTTPS bindingem. Pokud jich IIS hostí více, určí se cílový **název webu z IIS Manageru**; nejde o URL ani hostname:

```powershell
.\Install-IIS.ps1 `
  -PackagePath C:\Transfer\CAWeb-0.1.3-win-x64.zip `
  -SiteName 'Název existujícího webu v IIS'
```

Instalátor rozbalí verzi do `C:\inetpub\CAWeb\releases\<verze>`, vytvoří samostatný pool `CAWeb` s identitou `ApplicationPoolIdentity` a připojí jej v existujícím webu jako aplikaci `/caweb`. Databázi a klíče ukládá mimo web do `%ProgramData%\CAWeb\data` s omezeným ACL pro pool, SYSTEM a správce Windows.

Na kořenový web ani jeho aplikace a bindingy se nesahá. Název serveru, port a HTTPS certifikát se nikam do CAWeb nezadávají: prohlížeč použije stávající adresu webu a jeho TLS nastavení.

Po instalaci otevřete:

```text
https://<stejný-host-jako-kořenový-web>/caweb/
```

Ověření dostupnosti:

```powershell
Invoke-RestMethod https://<stejný-host-jako-kořenový-web>/caweb/health
```

## První spuštění

1. V prohlížeči otevřete adresu `/caweb/` uvedenou výše.
2. Průvodce vytvoří účet `admin` a vyžádá jméno, e-mail, osobní jazyk a heslo o délce alespoň 14 znaků.
3. SMTP nastavte podle potřeby; lze jej doplnit později.
4. Po přihlášení otevřete **Certifikační autorita → Importovat existující CA** a vyberte dosavadní CA PFX/P12 nebo certifikát a soukromý klíč PEM. Lokální soubory z `Podklady` se na server zkopírovat nemusí; vyberte je v prohlížeči na svém počítači.

## Aktualizace

Zkopírujte novější ZIP a `Install-IIS.ps1` na server a spusťte stejný příkaz `Install-IIS.ps1 -PackagePath ...`. Skript přidá novou verzovanou složku a přepne na ni pouze aplikaci `/caweb`. Databáze, Data Protection klíče, kořenový web, HTTPS binding i ostatní aplikace zůstanou zachované. Starší release složky ponechte pro návrat.

## Zálohování a obnova

Zálohujte celý `%ProgramData%\CAWeb\data` včetně SQLite databáze a složky `keys`, plus oddělený export CA PFX/P12. Podrobnosti jsou v [provozním postupu](OPERATIONS.md). Při obnově aplikaci opět připojte pod `/caweb` na stejném existujícím IIS webu.

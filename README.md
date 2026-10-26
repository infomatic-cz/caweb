# CAWeb

**CAWeb** je dvojjazyčná webová aplikace pro správu interní certifikační autority a HTTPS certifikátů serverů IIS a Tomcat. Na existujícím IIS se připojí jako podaplikace `/caweb` pod již běžící web a využije jeho HTTPS binding i certifikát. Lze ji instalovat do telefonu či počítače jako PWA.

## Co aplikace umí

- Úvodní průvodce vytvoří pevně určený účet `admin`, vyžádá jméno, e-mail, heslo, jazyk a nabídne nastavení SMTP. První heslo správce musí mít alespoň 14 znaků.
- Certifikační autoritu lze vytvořit jako RSA/ECDSA nebo importovat ze stávajícího PFX/P12 či z dvojice PEM/DER certifikát a PEM soukromý klíč. Import ověřuje příznak `CA:TRUE`, platnost, oprávnění `keyCertSign` a shodu veřejného a soukromého klíče.
- U serverů lze nastavit CN, celé DN (C/ST/L/O/OU), typ IIS/Tomcat, DNS a IP SAN, KeyUsage, RSA/ECDSA a délku platnosti 1–825 dní. CN se automaticky doplní do SAN.
- Každý server má stav, přehled alternativních názvů, obnovu s revizí parametrů, duplikaci, úpravu, odebrání a export do PEM, DER, CRT, P7B, PFX/P12 nebo samostatného šifrovaného klíče PEM.
- Uživatelé mohou požádat o registraci. Účet zůstane bez přístupu až do schválení správcem. Správce může také účty ručně vytvořit, změnit, deaktivovat nebo odebrat.
- SMTP heslo i privátní klíče jsou šifrované v uložených datech. Hesla uživatelů jsou uložena jako jednosměrný hash. Heslo exportovaného PFX se nikdy neukládá.

## Rychlý odkaz

- [Instalace pod `/caweb` na existujícím IIS (česky)](docs/INSTALL-IIS-CS.md)
- [IIS installation (English)](docs/INSTALL-IIS-EN.md)
- [Architektura a bezpečnostní hranice](docs/ARCHITECTURE.md)
- [Zálohy a provozní postupy](docs/OPERATIONS.md)
- [Změny verzí](CHANGELOG.md)

## Zdroje a tajné soubory

Zdrojové soubory patří do repozitáře; `Podklady/` je pouze lokální vstupní složka a její obsah je záměrně vyloučen z Gitu. CA klíče, PFX/P12, databáze, Data Protection klíče a generované certifikáty se do GitHubu nikdy neukládají. Výchozí provozní databáze je `C:\ProgramData\CAWeb\data\caweb.db`.

## Verze a vydání

Všechna sestavení, NuGet balíčky, testovací data i ZIP se vytvářejí v `C:\Temp\CAWeb-Build`, nikdy v OneDrive. Výsledný instalační ZIP a samostatný skript `Install-CAWeb.ps1` jsou ve složce `C:\Temp\CAWeb-Build\artifacts`. Skript vyžaduje 64bitový PowerShell 7 a správcovská oprávnění na Windows Serveru. Pro další změnu použijte z kořene repozitáře:

```powershell
.\Release.ps1 -Summary "Stručný popis změny"
```

Skript zvedne patch verzi, doplní `CHANGELOG.md`, vytvoří self-contained Windows x64 build, ověří aplikaci na kořeni i pod cestou `/caweb`, připraví ZIP a odešle změny přímo do `origin/main`. Při souběžné ruční změně na GitHubu nejprve stáhne a začlení vzdálené commity; konflikty ponechá k vyřešení bez zahazování souborů.

## Nasazení pod existující IIS web

Instalační skript připojí aplikaci jako samostatnou IIS podaplikaci `/caweb` pod existující `Default Web Site` a vytvoří jí vlastní aplikační pool. Bez parametrů vybere nejvyšší verzi ZIPu `CAWeb-*-win-x64.zip` v aktuální složce a instaluje ji do `C:\Apps\CAWeb`. Nezadává se hostname ani certifikát a kořenový web, jeho HTTPS bindingy ani další aplikace se nemění. Název webu a cílovou složku lze přepsat parametry `-SiteName` a `-InstallRoot`. Detaily jsou v [postupu nasazení](docs/INSTALL-IIS-CS.md).

## Aktuální rozsah

První verze spravuje jednu aktivní CA. Při její výměně se nevydávají automaticky nové certifikáty: uživatelé musí ručně zkontrolovat stav serverů, znovu je vydat a distribuovat nový kořenový certifikát. Aplikace připravuje PFX/P12, ale vzdáleně neupravuje IIS bindingy ani Java keystore.

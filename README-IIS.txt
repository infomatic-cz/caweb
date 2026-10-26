INSTALACE WEBOVYCH APLIKACI POD EXISTUJICI IIS WEB – PowerShell 7 / IIS 10
==========================================================================

U obou aplikaci vysledkem je podadresar IIS webu, nikoli novy IIS web:
  https://<server>/caweb/
  https://<server>/tta-mcp/

Jmena 'caweb' a 'tta-mcp' jsou vychozi cesty dany konkretnim instalacnim
skriptem. Volitelny prepinac -ApplicationPath umoznuje zmenit jen segment
cesty u existujiciho IIS webu; neni nutne ho zadavat.

U TTA MCP se uz NIKDY nezadava -PublicOrigin. Aplikace vsak potrebuje
znat verejnou zakladni HTTPS adresu kvuli sve konfiguraci, proto skript
ji zjisti z nastavenych HTTPS bindingu vybraneho IIS webu. Pokud ma web
vice ruznych hostnames nebo jen wildcard binding, zepta se na jmeno
serveru/IP adresu (nikoli na celou URL). Pro neinteraktivni instalaci
lze misto dotazu zadat volitelne -ServerHost "server.firma.cz".

1. CAWEB
---------
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Transfer\Install-CAWeb.ps1 -PackagePath "C:\Transfer\CAWeb-0.1.6-win-x64.zip" -InstallRoot "C:\inetpub\CAWeb"

Pokud je na IIS vice spustenych webu s HTTPS, doplnte -SiteName "Default Web Site".
CAWeb nevyzaduje zadani URL ani zmeny TLS vazby nebo certifikatu existujiciho webu.

2. TTA MCP
-----------
pwsh.exe -NoProfile -File C:\Transfer\Deploy-TTA-MCP-PS7-v4.ps1 -PackagePath "C:\Transfer\TTA-MCP-IIS-win-x64.zip" -SiteName "Default Web Site"

TTA MCP vyzaduje IIS HttpPlatformHandler a x64 Node.js odpovidajici
release. CAWeb vyzaduje .NET 10 ASP.NET Core Hosting Bundle.

U OBOU SKRIPTU:
- Pokud u CAWeb neni zadano -InstallRoot, skript se zepta na korenovou slozku,
  kam se ukladaji jednotlive verze jako <root>\releases\<version>.
- Volitelny parametr -ServiceAccount "DOMENA\svc_name" nastavi identitu
  aplikacniho poolu. Heslo se zada pri instalaci skrytym vstupem.
- Pokud servisni ucet neuvedete, nova instalace pouzije standardni
  IIS AppPool Identity; pri aktualizaci se stavajici identita zachova.
- Skripty nemení certifikaty, porty, vazby IIS a nevytvari nove weby.
- Pokud cilova IIS aplikace existuje jinde, skript z bezpecnostnich
  duvodu zastavi nasazeni a automaticky ji neprepise.
- Vyuzivaji appcmd.exe, ne modul WebAdministration.

POZOR: Jde o staticky kontrolovane skripty. Skutecny beh ve vasem IIS
prostredi vyzaduje overeni na serveru; certifikat a DNS musi spravne
fungovat pro zvolenou https://<server>/<aplikace> adresu.

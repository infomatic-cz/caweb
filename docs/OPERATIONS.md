# CAWeb — provoz a obnova

## Záloha před změnou

1. Zastavte `CAWeb` v IIS Manageru nebo zastavte aplikační pool.
2. Zkopírujte celý `%ProgramData%\CAWeb\data` včetně `caweb.db`, případných `caweb.db-wal` a `caweb.db-shm` a adresáře `keys` do šifrovaného záložního úložiště.
3. Data Protection klíče jsou ve složce `keys`, šifrované pomocí Windows DPAPI LocalMachine. Datová složka má ACL pro aplikační pool, SYSTEM a správce Windows. Při obnově na jiném serveru musí být obnoven odpovídající DPAPI stav.
4. Uchovávejte export CA PFX/P12 odděleně od aplikace, pouze v šifrovaném úložišti a s evidovaným heslem.
5. Znovu spusťte aplikační pool CAWeb a ověřte `https://<host>/caweb/health` a přihlášení na `https://<host>/caweb/`.

Samotná SQLite záloha bez složky `keys` neumí dešifrovat uložené privátní klíče a SMTP heslo. Na novém serveru lze znovu importovat externě uložený CA PFX/P12, který znáte a jehož heslo máte k dispozici.

## Provozní záznamy a chyby

- Správce je najde v **Nastavení aplikace → Provozní záznamy**. Seznam se načítá z posledních aplikačních varování a chyb; tlačítko **Obnovit záznamy** načte aktuální stav.
- Neočekávaná chyba se zobrazí s krátkým ID požadavku. V záznamech vyhledejte stejné ID; detail obsahuje výjimku a zásobník volání, podle kterých lze určit příčinu.
- Provozní soubory jsou v `%ProgramData%\CAWeb\data\logs`. Každý soubor má limit 5 MB, starší soubory se při startu aplikace mažou po 30 dnech. Zahrňte tuto složku do záloh, pokud potřebujete zachovat historii incidentů.
- Záznamy nezahrnují těla HTTP požadavků, hesla ani obsah privátních klíčů. Přístup k prohlížeči záznamů mají pouze správci CAWeb; k souborům na disku mají přístup účty s oprávněním ke složce dat.
- Při serverové validaci aplikace zobrazí konkrétní chybu přímo uvnitř otevřeného formuláře a ponechá zadané hodnoty. U neočekávané chyby použijte ID z hlášky.

## Import a kontrola CA

- Upozornění na výměnu klíče se zobrazuje při generování nové CA, protože to vždy vytvoří nový klíč. Při importu se nejdřív zobrazí obecné potvrzení nahrazení existující autority; po importu aplikace porovná otisk certifikátu a SHA-256 otisk veřejného klíče.
- Pokud se shoduje SHA-1 otisk certifikátu, byla naimportována totožná CA. Pokud se certifikát liší, ale SHA-256 otisk klíče se shoduje, zkontrolujte stav certifikátů a distribuci obnoveného certifikátu CA. Při rozdílném klíči je nutné vydat serverové certifikáty znovu a distribuovat nový kořen.
- IPv4 i IPv6 lze zadat do pole alternativních IP adres. Veřejný certifikát obsahuje tyto adresy v SAN jako IP adresy.
- Název serveru se uloží také jako `Friendly Name` v PFX/P12. IIS jej zobrazí v místním úložišti certifikátů; nejde o CN certifikátu, který zůstává jeho DNS/IP identitou. Stejný Friendly Name se přidá i při pozdějším exportu PFX/P12.

## Obnova aplikace

- Zkopírujte nový instalační ZIP a `Install-CAWeb.ps1` do jedné složky na serveru. Z 64bitového PowerShellu 7 spuštěného jako správce přejděte do této složky a spusťte `.\Install-CAWeb.ps1` bez parametrů. Vybere nejvyšší verzi ZIPu, použije `Default Web Site` a instaluje do `C:\Apps\CAWeb\releases\<verze>`. Pro jiný web nebo cestu lze zadat `-SiteName` nebo `-InstallRoot`.
- Ponechte oddělený pool `CAWeb` a data v `%ProgramData%\CAWeb\data`; skript nemění kořenový web ani jeho HTTPS binding.
- Pokud se server měnil, obnovte DPAPI/Data Protection klíče na odpovídající Windows instanci. Bez nich databáze zůstane čitelná, ale šifrovaná pole zůstanou nedostupná.
- Podaplikaci připojte zpět pod `/caweb` na existujícím IIS webu a otestujte `https://<host>/caweb/health`, přihlášení, metadata CA a vydání testovacího certifikátu.

## Rotace CA

1. Před regenerací ověřte export a offline zálohu stávající CA.
2. V detailu CA zvolte obnovení a potvrďte upozornění. Nový klíč vytvoří novou identitu kořene.
3. V části Servery otevřete každý server, zkontrolujte CN/DN, DNS a IP SAN, KeyUsage, typ serveru a platnost. U každého potvrďte revizi, vydejte nové PFX/P12 a nainstalujte ho na cílový server.
4. Exportujte nový veřejný certifikát CA a bezpečně jej distribuujte do trust store klientů.
5. Ověřte TLS handshake z reprezentativních klientů a teprve potom vyřaďte původní důvěru.

## Vydání nové aplikace

Použijte pouze `Release.ps1 -Summary "..."`. Build, lokální data testu, publish a ZIP ukládá pod `C:\Temp\CAWeb-Build`. Skript před vydáním naváže případné změny z `origin/main`, zvýší patch verzi, zapíše změnu do changelogu, ověří aplikaci a odešle commit přímo na `main`.

# CAWeb — provoz a obnova

## Záloha před změnou

1. Zastavte `CAWeb` v IIS Manageru nebo zastavte aplikační pool.
2. Zkopírujte celý `%ProgramData%\CAWeb\data` včetně `caweb.db`, případných `caweb.db-wal` a `caweb.db-shm` a adresáře `keys` do šifrovaného záložního úložiště.
3. Data Protection klíče jsou ve složce `keys`, šifrované pomocí Windows DPAPI LocalMachine. Datová složka má ACL pro aplikační pool, SYSTEM a správce Windows. Při obnově na jiném serveru musí být obnoven odpovídající DPAPI stav.
4. Uchovávejte export CA PFX/P12 odděleně od aplikace, pouze v šifrovaném úložišti a s evidovaným heslem.
5. Znovu spusťte aplikační pool CAWeb a ověřte `https://<host>/caweb/health` a přihlášení na `https://<host>/caweb/`.

Samotná SQLite záloha bez složky `keys` neumí dešifrovat uložené privátní klíče a SMTP heslo. Na novém serveru lze znovu importovat externě uložený CA PFX/P12, který znáte a jehož heslo máte k dispozici.

## Obnova aplikace

- Zkopírujte nový instalační ZIP na server a spusťte `Install-IIS.ps1 -PackagePath <ZIP>`. Skript rozbalí novou verzi do `C:\inetpub\CAWeb\releases\<verze>` a přesměruje pouze IIS podaplikaci `/caweb`.
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

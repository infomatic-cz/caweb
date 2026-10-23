# CAWeb — architektura a bezpečnost

## Přehled

CAWeb je .NET 10 ASP.NET Core aplikace bez externího frontendového frameworku. Prohlížeč obsluhuje soubory z `wwwroot/` a volá stejno-origin API `/api`. Výchozí provozní datový adresář je `%ProgramData%\CAWeb\data`; cestu lze nastavit proměnnou procesu `CAWEB_DATA_DIR`.

| Oblast | Implementace |
| --- | --- |
| Úložiště | SQLite `caweb.db`, WAL a parametrizované dotazy |
| Hesla uživatelů | ASP.NET Core `PasswordHasher<AppUser>`, hash s náhodnou solí |
| Přihlášení | HttpOnly cookie, Lax SameSite, 8 hodin, posuvná expirace |
| CSRF | Všechny API zápisy vyžadují vlastní hlavičku `X-CAWeb-Request: 1`; CORS není povolen |
| Privátní klíče a SMTP heslo | Šifrované sloupce SQLite pomocí ASP.NET Core Data Protection |
| Data Protection key ring | `%ProgramData%\CAWeb\data\keys`, šifrování DPAPI LocalMachine, přístup pro aplikační pool, SYSTEM a správce Windows |
| Audit | Změny účtů, CA a certifikátů; bez hesel a klíčového materiálu |
| Ochranné hlavičky | CSP, `nosniff`, `DENY`, `no-referrer`, HSTS mimo Development |

## Toky certifikátů

1. CA import přijímá PFX/P12 s privátním klíčem nebo certifikát PEM/DER spolu s klíčem PEM. Heslo použité k importu se zahodí po načtení. Aplikace ověří CA basic constraints, případné Key Usage, platnost a shodu klíče s certifikátem.
2. Soukromý klíč se normalizuje na PKCS#8, zašifruje pomocí účelově odděleného Data Protection purpose a uloží do SQLite. Certifikát se ukládá jako veřejné DER.
3. Vydání serverového certifikátu vygeneruje nový RSA 3072 nebo ECDSA P-256 klíč. CSR nahrazuje přímo vytvořený požadavek `CertificateRequest`; vytvořené SAN zahrnují DNS/IP a CN. Do certifikátu se přidá `serverAuth`, základní omezení `CA:false` a vybrané KeyUsage.
4. Certifikát a klíč se uloží do aplikace chráněné úložiště. PFX/P12 s privátním klíčem a pouze veřejným kořenovým certifikátem se ihned stáhne pod heslem zadaným správcem. Heslo se neukládá.
5. Budoucí PFX, P12 nebo šifrovaný klíč PEM se při exportu znovu sestaví. Heslo se zadává při každém takovém exportu.

CA key material and server key material are decrypted only for the operation that needs it. The server PFX contains the leaf private key and the **public** CA certificate; it never contains the CA private key.

## Oprávnění

- Správce: CA import/generování/export, SMTP a registrace, účty, audit a všechny serverové operace.
- Schválený uživatel: seznam serverů, serverové parametry, vydání/obnova a export serverových certifikátů.
- Čekající, deaktivovaný nebo smazaný účet: bez přístupu. U každého API volání se účet ověřuje proti SQLite, takže deaktivace zruší přístup i již přihlášené relaci.

## Omezení a provozní předpoklady

- Aplikace záměrně drží pouze jednu aktuální CA. Změna CA označí staré certifikáty stavem `CA changed`; nová serverová sada a distribuce důvěryhodného kořene jsou samostatná operace.
- Certifikáty nejsou automaticky instalovány na vzdálené servery. Uživatel importuje připravený PFX/P12 do IIS/Tomcat.
- Provozujte aplikaci pouze přes HTTPS. `Install-IIS.ps1` zakládá HTTPS binding, odstraňuje HTTP binding a vyžaduje existující certifikát pro administrační web.
- Data Protection key ring pod datovým adresářem a SQLite jsou svázané s tímto Windows serverem přes DPAPI LocalMachine. Záloha musí zahrnovat obojí, nebo je třeba uchovávat CA mimo aplikaci.

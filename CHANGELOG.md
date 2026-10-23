# Changelog

## 0.1.1 — 2026-10-23

- První provozní sestavení aplikace CAWeb pro IIS

## 0.1.0 — 2026-10-23

- Založena dvojjazyčná ASP.NET Core aplikace CAWeb pro správu certifikační autority a serverových TLS certifikátů.
- Přidán úvodní průvodce správce a SMTP, schvalování registrací, správa uživatelů, SQLite úložiště, auditní záznamy a per-user jazyk.
- Přidán import CA PFX/P12 nebo certifikátu a privátního PEM klíče, generování RSA/ECDSA autority, serverové SAN a KeyUsage, obnova a export PEM/DER/CRT/P7B/PFX/P12/šifrovaný PEM klíč.
- Privátní klíče a SMTP heslo jsou chráněné ASP.NET Core Data Protection; hesla účtů používají `PasswordHasher`.
- Přidány responzivní PWA rozhraní, instalační postup IIS, verzovaný build mimo OneDrive a integrační smoke test.

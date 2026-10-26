# Changelog

## 0.1.12 — 2026-10-26

- Doplnění Friendly Name serveru do vydaných a exportovaných PFX/P12

## 0.1.11 — 2026-10-26

- Ověření podpisu ECDSA CA nad certifikátem RSA a RSA CA nad certifikátem ECDSA

## 0.1.10 — 2026-10-26

- Oprava podpisu certifikátů mezi RSA a ECDSA CA/servery a přejmenování nastavení aplikace

## 0.1.9 — 2026-10-26

- Ověření vystavení serverového certifikátu po importu CA v P12 i PEM formátu

## 0.1.8 — 2026-10-26

- Oprava rozlišení importované CA, podpora IPv6 v SAN, viditelné chyby formulářů a provozní záznamy

## 0.1.7 — 2026-10-26

- Zjednodušení instalace bez parametrů: automatický výběr nejvyššího ZIPu, Default Web Site a C:\Apps\CAWeb

## 0.1.6 — 2026-10-26

- Oprava úpravy environmentVariables v IIS web.config přes XML DOM místo PowerShell property adapteru

## 0.1.5 — 2026-10-26

- Oprava zpracování web.config s ASP.NET Core handlerem uvnitř IIS location elementu

## 0.1.4 — 2026-10-26

- Aktualizace IIS instalátoru na PowerShell 7 a AppCmd, zachování identities při aktualizaci, oprava dokumentace a balení skriptu

## 0.1.3 — 2026-10-23

- Oprava routování pod IIS cestou /caweb a instalace jako podaplikace existujícího HTTPS webu

## 0.1.2 — 2026-10-23

- Instalace jako podaplikace /caweb pod existujícím IIS webem

## 0.1.1 — 2026-10-23

- První provozní sestavení aplikace CAWeb pro IIS

## 0.1.0 — 2026-10-23

- Založena dvojjazyčná ASP.NET Core aplikace CAWeb pro správu certifikační autority a serverových TLS certifikátů.
- Přidán úvodní průvodce správce a SMTP, schvalování registrací, správa uživatelů, SQLite úložiště, auditní záznamy a per-user jazyk.
- Přidán import CA PFX/P12 nebo certifikátu a privátního PEM klíče, generování RSA/ECDSA autority, serverové SAN a KeyUsage, obnova a export PEM/DER/CRT/P7B/PFX/P12/šifrovaný PEM klíč.
- Privátní klíče a SMTP heslo jsou chráněné ASP.NET Core Data Protection; hesla účtů používají `PasswordHasher`.
- Přidány responzivní PWA rozhraní, instalační postup IIS, verzovaný build mimo OneDrive a integrační smoke test.

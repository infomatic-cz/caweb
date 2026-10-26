const text = {
  cs: {
    product: "Správa certifikátů", productLong: "Certifikační autorita · TLS", loginTitle: "Vítejte zpět", loginSubtitle: "Přihlaste se ke správě certifikátů.", username: "Uživatelské ID", password: "Heslo", signIn: "Přihlásit se", noAccount: "Nemáte účet?", createAccount: "Požádat o přístup", welcomeHeading: "Důvěra pro každý server.", welcomeText: "Jedno bezpečné místo pro interní certifikační autoritu a všechny vaše HTTPS certifikáty.", privateStorage: "Klíče šifrované při uložení", approvalGate: "Přístup až po schválení administrátorem", formats: "Export pro IIS i Tomcat", localFirst: "Soukromá správa · nasazení na IIS", signInHint: "Přihlaste se svým schváleným účtem.",
    setupTitle: "Začněme bezpečným nastavením", setupSubtitle: "Vytvoříme účet správce a připravíme e-mailová upozornění.", stepAdmin: "Správce", stepEmail: "E-mail", stepFinish: "Dokončení", next: "Pokračovat", back: "Zpět", finishSetup: "Dokončit nastavení", skipSmtp: "SMTP můžete nechat prázdné a doplnit později.",
    fullName: "Jméno a příjmení", email: "E-mailová adresa", confirmPassword: "Potvrdit heslo", language: "Jazyk aplikace", administratorAccount: "Výchozí účet správce", smtpSetup: "SMTP server", smtpHost: "Server SMTP", smtpPort: "Port", smtpFrom: "Odesílatel", smtpUsername: "Uživatelské jméno SMTP", smtpPassword: "Heslo SMTP", smtpPasswordHint: "Uloží se šifrovaně. Pole můžete při úpravách nechat prázdné.", tls: "Používat TLS", registration: "Povolit žádosti o registraci", completionTitle: "Vše je připraveno", completionText: "Účet správce je uložen. Po přihlášení můžete importovat svou stávající certifikační autoritu.",
    navWorkspace: "PRACOVNÍ PROSTOR", navOverview: "Přehled", navServers: "Servery a certifikáty", navAuthority: "Certifikační autorita", navAdministration: "SPRÁVA", navUsers: "Uživatelé", navSettings: "Nastavení aplikace", signOut: "Odhlásit", adminRole: "Správce", userRole: "Uživatel",
    overviewTitle: "Přehled", overviewSubtitle: "Stav certifikační autority a přehled zabezpečení serverů.", greeting: "Dobrý den", overviewEyebrow: "SPRÁVA TLS", overviewHero: "Vaše interní certifikační autorita na jednom místě.", overviewHeroText: "Vydávejte, obnovujte a exportujte certifikáty pro všechny své služby.", issuerLabel: "Certifikační autorita", expiryLabel: "Platnost do", noAuthority: "Autorita zatím není nastavena", configureAuthority: "Nastavit CA", serversTotal: "Servery", serversTotalNote: "spravované služby", certificatesActive: "Aktivní certifikáty", certificatesActiveNote: "ověřené a platné", needsAttention: "Vyžaduje pozornost", needsAttentionNote: "nebo čeká na certifikát", waitingApprovals: "Žádosti o přístup", waitingApprovalsNote: "čeká na vaše schválení", serverOverview: "Nedávno spravované servery", allServers: "Zobrazit servery", recentActivity: "Nedávná aktivita", noActivity: "Zatím zde nejsou žádné změny.", quickActions: "Rychlé akce", addServer: "Přidat server", openAuthority: "Otevřít autoritu", setupSmtp: "Nastavit e-mail", noServers: "Zatím žádné servery", noServersText: "Přidejte server a připravte jeho první HTTPS certifikát.",
    serversTitle: "Servery a certifikáty", serversSubtitle: "Spravujte parametry, vydávejte a obnovujte certifikáty pro IIS i Tomcat.", searchServers: "Hledat server nebo název certifikátu…", allStatuses: "Všechny stavy", colServer: "SERVER", colType: "TYP", colNames: "ALTERNATIVNÍ NÁZVY", colStatus: "STAV", colExpiry: "PLATNOST", colActions: "AKCE", noMatch: "Nenalezen žádný server", noMatchText: "Upravte hledaný výraz nebo přidejte nový server.", edit: "Upravit", duplicate: "Duplikovat", issue: "Vydat / obnovit", export: "Export", remove: "Odebrat",
    caTitle: "Certifikační autorita", caSubtitle: "Zabezpečte kořenový klíč a spravujte vydávání serverových certifikátů.", caConfigured: "Autorita je připravena", caMissing: "Není nastavena žádná autorita", caMissingText: "Importujte existující CA a zachovejte důvěru ve své současné certifikáty, nebo vygenerujte novou.", importExisting: "Importovat existující CA", generateAuthority: "Vygenerovat autoritu", authoritySubject: "Rozlišovaný název", fingerprint: "Otisk SHA-1", publicKeyFingerprint: "Otisk veřejného klíče SHA-256", keyType: "Typ klíče", issuedServers: "Spravované servery", validity: "Platnost", imported: "Importováno", generated: "Vygenerováno", exportFiles: "Exportovat certifikát a klíče", renewAuthority: "Obnovit / nahradit CA", importInfo: "Soukromý klíč se po importu uloží šifrovaně v úložišti aplikace.", renewWarning: "Vygenerování nové CA vždy vytvoří nový klíč. Certifikáty vydané původní CA bude nutné obnovit a novou CA znovu distribuovat.", importReplacementWarning: "Importovaná CA může mít jiný certifikát nebo klíč než právě uložená autorita. Po importu porovnejte otisk CA a zkontrolujte stav serverových certifikátů.", confirmReplacement: "Potvrzuji nahrazení právě uložené certifikační autority.",
    serverFormTitleNew: "Přidat server", serverFormTitleEdit: "Upravit server", serverName: "Název serveru", serverType: "Webový server", commonName: "Common Name (CN)", country: "Země (C)", state: "Stát / kraj (ST)", locality: "Město (L)", organization: "Organizace (O)", organizationalUnit: "Oddělení (OU)", dnsNames: "Alternativní názvy DNS", ipAddresses: "Alternativní IP adresy", altHint: "Každou hodnotu zadejte na nový řádek nebo ji oddělte čárkou. IP adresy mohou být IPv4 i IPv6.", keyUsage: "KeyUsage", digitalSignature: "Digital Signature", keyEncipherment: "Key Encipherment", keyAgreement: "Key Agreement", dataEncipherment: "Data Encipherment", nonRepudiation: "Non-repudiation", keyAlgorithm: "Algoritmus klíče", rsa: "RSA · nejširší kompatibilita", ecdsa: "ECDSA · menší klíč", validDays: "Platnost certifikátu ve dnech", description: "Poznámka", saveServer: "Uložit server", cancel: "Zrušit", reviewRenewal: "Před vydáním zkontrolujte údaje níže. Certifikát se podepíše aktuální CA.", reviewConfirmed: "Zkontroloval(a) jsem CN, SAN, použití klíče a platnost.", serverIssueTitle: "Vydat serverový certifikát", serverIssueSubtitle: "Vygeneruje se privátní klíč a chráněný PFX/P12 ke stažení.", certificatePassword: "Heslo certifikátu / PFX", reenterPassword: "Zopakujte heslo", pfxHint: "Heslo použijete při instalaci certifikátu v IIS nebo Tomcat. Aplikace si ho neukládá.",
    status: "STAV", active: "Aktivní", expiring: "Brzy vyprší", expired: "Prošlý", notIssued: "Nevydán", reviewNeeded: "Nutná revize", caChanged: "Změněná CA", pending: "Čeká na schválení", disabled: "Deaktivován", rejected: "Zamítnut", certificateActive: "Certifikát je platný.", certificateExpiring: "Platnost brzy skončí.", certificateExpired: "Certifikát vypršel.", certificateMissing: "Zatím bez vydaného certifikátu.", parametersChanged: "Parametry se změnily — obnovte certifikát.", issuerChanged: "CA se změnila — obnovte certifikát.",
    userTitle: "Správa uživatelů", usersSubtitle: "Schvalujte žádosti a spravujte přístup do aplikace.", addUser: "Přidat uživatele", pendingRequests: "Čeká na schválení", activeUsers: "Aktivní účty", totalUsers: "Celkem účtů", noUsers: "Zatím žádní další uživatelé", noUsersText: "Můžete účet vytvořit ručně nebo zapnout žádosti o registraci.", approve: "Schválit", reject: "Zamítnout", manage: "Upravit účet", userFormNew: "Nový uživatel", userFormEdit: "Upravit uživatele", accountStatus: "Stav účtu", role: "Oprávnění", newPassword: "Nové heslo", passwordKeepHint: "Ponechte prázdné, pokud heslo nechcete změnit.", createUser: "Vytvořit uživatele", saveChanges: "Uložit změny", requestAccess: "Žádost o přístup", requestAccessText: "Účet se aktivuje až po schválení správcem.", submitRequest: "Odeslat žádost", registrationSent: "Žádost byla odeslána. Počkejte na schválení správce.", approvalRequired: "Účet čeká na schválení administrátorem.", accountDisabled: "Tento účet je deaktivovaný.",
    settingsTitle: "Nastavení aplikace", settingsSubtitle: "Nastavte e-mailová upozornění, registraci a provoz aplikace.", operationalLogs: "Provozní záznamy", operationalLogsHelp: "Poslední varování a chyby aplikace. Podrobnosti obsahují identifikátor požadavku a zásobník volání; hesla a obsah privátních klíčů se nezaznamenávají.", refreshLogs: "Obnovit záznamy", noLogs: "Zatím nejsou zaznamenána žádná varování ani chyby.", logDetails: "Technické podrobnosti", logReference: "ID požadavku", smtpSettings: "Odchozí pošta", smtpSecurity: "Přihlašovací údaje jsou šifrované. Pro provoz aplikace nejsou potřeba externí SMTP služby.", testEmail: "Testovací e-mail", testEmailAddress: "Odeslat test na adresu", sendTest: "Odeslat test", testEmailSent: "Testovací e-mail byl odeslán.", testSmtpHint: "Nejdříve uložte nastavení SMTP. Heslo může zůstat prázdné, pokud používáte anonymní SMTP.", registrationTitle: "Registrace uživatelů", registrationHelp: "Registrované účty zůstávají bez přístupu, dokud je správce neschválí.", smtpSaved: "Nastavení SMTP bylo uloženo.", registrationOn: "Žádosti o registraci jsou zapnuté.", registrationOff: "Veřejné žádosti o registraci jsou vypnuté.",
    exportTitle: "Export certifikátu", exportSubtitle: "Zvolte formát pro cílový server.", exportPassword: "Heslo pro chráněný soubor", exportKeyWarning: "Privátní klíč opouští aplikaci. Uložte stažený soubor do zabezpečeného úložiště.", downloadFile: "Stáhnout soubor", formatPem: "PEM certifikát", formatDer: "DER certifikát", formatCrt: "CRT certifikát", formatP7b: "PKCS#7 / P7B", formatP12: "PKCS#12 / P12", formatPfx: "PFX pro IIS", formatKey: "Šifrovaný privátní klíč", importing: "Importovat CA", importPfx: "PFX / P12 soubor", importCertificate: "Veřejný certifikát PEM / DER", importKey: "Soukromý klíč PEM", importKeyPassword: "Heslo k importovanému klíči", chooseFile: "Vybrat soubor", importAuthorityAction: "Importovat CA", importModePfx: "Použiji existující PFX / P12", importModePair: "Certifikát a klíč zvlášť", caGenerateForm: "Parametry nové CA", caKeyPassword: "Heslo exportu klíče CA", caValidity: "Platnost CA ve dnech", rsaBits: "Délka RSA klíče", caCreated: "Certifikační autorita je připravena.", caImportedSuccess: "Stávající CA byla naimportována.", caImportedSame: "Importována stejná CA. Její certifikát i klíč zůstaly beze změny.", caImportedSameKey: "Certifikát CA se změnil, ale veřejný klíč zůstal stejný. Zkontrolujte otisk CA a stav serverových certifikátů.", caImportedNewKey: "Importovaná CA má jiný klíč. Obnovte certifikáty serverů a distribuujte nový kořen.", caExportReady: "Záložní P12 s CA je stažen.", serverCreated: "Server byl přidán.", serverUpdated: "Server byl upraven.", certificateIssued: "Certifikát je vydán a PFX/P12 stažen.",
    confirmationTitle: "Potvrdit akci", confirmDeleteServer: "Opravdu chcete odebrat tento server a jeho uložený certifikát? Akci nelze vrátit.", confirmDeleteUser: "Opravdu chcete uživatele odebrat?", confirmRejectUser: "Opravdu zamítnout tuto žádost o přístup?", confirmAction: "Potvrdit", serverDeleted: "Server byl odebrán.", userApproved: "Účet byl schválen.", userRejected: "Žádost byla zamítnuta.", userSaved: "Účet byl uložen.", userCreated: "Uživatel byl vytvořen.",
    error_generic: "Akci se nepodařilo dokončit.", error_invalid_setup_details: "Vyplňte jméno, platný e-mail a jazyk.", error_invalid_registration: "Zkontrolujte uživatelské ID, jméno, e-mail a jazyk.", error_invalid_user_details: "Zkontrolujte jméno, e-mail a jazyk uživatele.", error_invalid_password: "Heslo neodpovídá požadavkům.", error_password_too_short: "Zvolte heslo alespoň s 12 znaky (účet správce vyžaduje 14).", error_password_mismatch: "Zadaná hesla se neshodují.", error_conflict: "Účet s tímto ID už existuje.", error_account_locked: "Příliš mnoho chybných pokusů. Zkuste to později.", error_approval_required: "Žádost čeká na schválení správce.", error_account_disabled: "Účet je deaktivován. Kontaktujte správce.", error_invalid_language: "Vyberte češtinu nebo angličtinu.", error_invalid_server_name: "Zadejte název serveru.", error_invalid_server_type: "Vyberte IIS nebo Tomcat.", error_invalid_common_name: "Zkontrolujte Common Name (CN).", error_invalid_country: "Kód země musí mít dvě písmena, například CZ.", error_invalid_dns_name: "Zkontrolujte DNS název nebo jeho zápis IDN.", error_invalid_ip_address: "Zadejte platnou IPv4 nebo IPv6 adresu bez názvu rozhraní, například 2001:db8::25.", error_san_required: "Zadejte alespoň jeden alternativní název DNS nebo IP.", error_invalid_certificate_validity: "Platnost serverového certifikátu musí být 1 až 825 dnů.", error_invalid_ca_validity: "Platnost CA musí být 365 až 3650 dnů.", error_missing_key_usage: "Vyberte alespoň jedno použití klíče.", error_invalid_key_algorithm: "Zvolte podporovaný algoritmus klíče RSA nebo ECDSA.", error_unsupported_ca_key: "Privátní klíč CA není podporovaný. Použijte RSA nebo ECDSA.", error_unsupported_key_algorithm: "Zvolený algoritmus klíče není podporovaný.", error_certificate_export_failed: "Certifikát se nepodařilo sestavit do požadovaného formátu. Zkontrolujte heslo a úložiště klíčů.", error_private_key_missing: "K certifikátu chybí privátní klíč.", error_upload_too_large: "Nahraný soubor je větší než povolených 10 MB.", error_too_many_san_entries: "Příliš mnoho alternativních názvů (limit je 100).", error_ca_not_configured: "Nejdříve nastavte certifikační autoritu.", error_ca_expired: "Importovaná CA je po platnosti.", error_ca_not_yet_valid: "Importovaná CA ještě není platná.", error_certificate_not_ca: "Certifikát nemá příznak CA:TRUE.", error_ca_cannot_sign: "Certifikát nemá oprávnění Key Cert Sign.", error_ca_pfx_missing_private_key: "PFX neobsahuje odpovídající privátní klíč CA.", error_missing_ca_pair: "Vyberte veřejný certifikát a soukromý klíč CA.", error_missing_pfx: "Vyberte soubor PFX/P12.", error_ca_key_password_or_format_invalid: "Heslo nebo formát soukromého klíče není správný.", error_ca_key_or_format_invalid: "Soukromý klíč má nepodporovaný formát.", error_ca_import_failed: "CA nelze načíst. Zkontrolujte soubory a heslo.", error_private_key_mismatch: "Soukromý klíč nepatří k vybranému certifikátu.", error_ca_replacement_confirmation_required: "Před změnou CA potvrďte upozornění.", error_review_required: "Před vydáním potvrďte revizi parametrů.", error_certificate_not_issued: "Tento server zatím nemá vydaný certifikát.", error_export_password_required: "Tento export vyžaduje heslo.", error_unsupported_export_format: "Vyberte podporovaný formát exportu.", error_invalid_smtp_settings: "Zkontrolujte hostitele SMTP, port a adresu odesílatele.", error_smtp_not_configured: "Nejdříve uložte nastavení SMTP.", error_invalid_email: "Zadejte platnou e-mailovou adresu.", error_last_active_admin: "V aplikaci musí zůstat alespoň jeden aktivní správce.", error_cannot_remove_own_admin_access: "Nemůžete odebrat vlastní účet správce.", error_cannot_delete_self: "Nemůžete odebrat právě přihlášený účet.", error_user_not_pending: "Tento účet už nečeká na schválení.", error_delete_confirmation_required: "Potvrďte odebrání.", error_invalid_user_status: "Zvolte platný stav účtu.", error_setup_already_completed: "První nastavení už proběhlo. Přihlaste se účtem správce.", error_csrf_header_required: "Požadavek vypršel. Obnovte stránku a zkuste to znovu.", error_server_error: "Na serveru nastala chyba. Zkuste to znovu.", error_server_error_reference: "Na serveru nastala chyba (ID {id}). Nastavení → Provozní záznamy zobrazí technický důvod.", error_unauthenticated: "Přihlášení vypršelo. Znovu se přihlaste.",
    footerVersion: "Zabezpečená interní správa certifikátů", saved: "Uloženo", loading: "Načítání…", viewDetails: "Podrobnosti", notConfigured: "Nenastaveno", yes: "Ano", no: "Ne", required: "Povinné", optional: "Volitelné", passwordShow: "Zobrazit heslo", passwordHide: "Skrýt heslo", savedPassword: "Heslo je uloženo. Pro změnu zadejte nové.", owner: "Správce", userStatus: "Stav", languageSaved: "Jazyk byl změněn.", registrationPendingTitle: "Čeká na schválení", registrationPendingText: "Správce obdržel vaši žádost. Po schválení se můžete přihlásit.", registrationDisabled: "Registrace je vypnutá.", close: "Zavřít", copy: "Kopírovat", copied: "Zkopírováno", serverDetails: "Parametry serveru", cannotDownload: "Soubor se nepodařilo stáhnout.", error_invalid_credentials: "ID nebo heslo není správné.",
  },
  en: {
    product: "Certificate management", productLong: "Certificate authority · TLS", loginTitle: "Welcome back", loginSubtitle: "Sign in to manage certificates.", username: "User ID", password: "Password", signIn: "Sign in", noAccount: "Need an account?", createAccount: "Request access", welcomeHeading: "Trust for every server.", welcomeText: "One secure place for your internal certificate authority and every HTTPS certificate.", privateStorage: "Keys encrypted at rest", approvalGate: "Access begins after administrator approval", formats: "Export for IIS and Tomcat", localFirst: "Private management · hosted on IIS", signInHint: "Sign in with your approved account.",
    setupTitle: "Let's set up your secure workspace", setupSubtitle: "Create the administrator account and configure email notifications.", stepAdmin: "Administrator", stepEmail: "Email", stepFinish: "Finish", next: "Continue", back: "Back", finishSetup: "Finish setup", skipSmtp: "You can leave SMTP blank and configure it later.",
    fullName: "Full name", email: "Email address", confirmPassword: "Confirm password", language: "Application language", administratorAccount: "Default administrator account", smtpSetup: "SMTP server", smtpHost: "SMTP host", smtpPort: "Port", smtpFrom: "Sender address", smtpUsername: "SMTP username", smtpPassword: "SMTP password", smtpPasswordHint: "Stored encrypted. Leave blank when editing to keep the current value.", tls: "Use TLS", registration: "Allow registration requests", completionTitle: "You're all set", completionText: "Your administrator account is saved. Import your existing certificate authority after signing in.",
    navWorkspace: "WORKSPACE", navOverview: "Overview", navServers: "Servers & certificates", navAuthority: "Certificate authority", navAdministration: "ADMINISTRATION", navUsers: "Users", navSettings: "Application settings", signOut: "Sign out", adminRole: "Administrator", userRole: "User",
    overviewTitle: "Overview", overviewSubtitle: "Certificate authority health and server security at a glance.", greeting: "Hello", overviewEyebrow: "TLS MANAGEMENT", overviewHero: "Your internal certificate authority, in one place.", overviewHeroText: "Issue, renew and export certificates for all your services.", issuerLabel: "Certificate authority", expiryLabel: "Valid until", noAuthority: "No authority configured yet", configureAuthority: "Configure CA", serversTotal: "Servers", serversTotalNote: "managed services", certificatesActive: "Active certificates", certificatesActiveNote: "verified and current", needsAttention: "Needs attention", needsAttentionNote: "or awaiting a certificate", waitingApprovals: "Access requests", waitingApprovalsNote: "waiting for your review", serverOverview: "Recently managed servers", allServers: "View servers", recentActivity: "Recent activity", noActivity: "No changes have been recorded yet.", quickActions: "Quick actions", addServer: "Add server", openAuthority: "Open authority", setupSmtp: "Configure email", noServers: "No servers yet", noServersText: "Add a server to prepare its first HTTPS certificate.",
    serversTitle: "Servers and certificates", serversSubtitle: "Manage parameters, issue and renew certificates for IIS and Tomcat.", searchServers: "Search servers or certificate names…", allStatuses: "All statuses", colServer: "SERVER", colType: "TYPE", colNames: "ALTERNATE NAMES", colStatus: "STATUS", colExpiry: "VALID UNTIL", colActions: "ACTIONS", noMatch: "No server found", noMatchText: "Change the search or add a server.", edit: "Edit", duplicate: "Duplicate", issue: "Issue / renew", export: "Export", remove: "Remove",
    caTitle: "Certificate authority", caSubtitle: "Protect your root key and manage server certificate issuance.", caConfigured: "Authority ready", caMissing: "No authority configured", caMissingText: "Import your existing CA to preserve trust in current certificates, or generate a new one.", importExisting: "Import existing CA", generateAuthority: "Generate authority", authoritySubject: "Distinguished name", fingerprint: "SHA-1 fingerprint", publicKeyFingerprint: "SHA-256 public key fingerprint", keyType: "Key type", issuedServers: "Managed servers", validity: "Validity", imported: "Imported", generated: "Generated", exportFiles: "Export certificate and keys", renewAuthority: "Renew / replace CA", importInfo: "The private key is encrypted in the application data store after import.", renewWarning: "Generating a new CA always creates a new key. Renew certificates signed by the old CA and distribute the new CA again.", importReplacementWarning: "The imported CA may have a different certificate or key from the currently stored authority. Compare its fingerprint after import and review server certificate statuses.", confirmReplacement: "I confirm replacing the currently stored certificate authority.",
    serverFormTitleNew: "Add server", serverFormTitleEdit: "Edit server", serverName: "Server name", serverType: "Web server", commonName: "Common Name (CN)", country: "Country (C)", state: "State / region (ST)", locality: "City (L)", organization: "Organization (O)", organizationalUnit: "Organizational unit (OU)", dnsNames: "DNS alternate names", ipAddresses: "IP alternate addresses", altHint: "Enter one value per line or separate values with commas. IP addresses can be IPv4 or IPv6.", keyUsage: "KeyUsage", digitalSignature: "Digital Signature", keyEncipherment: "Key Encipherment", keyAgreement: "Key Agreement", dataEncipherment: "Data Encipherment", nonRepudiation: "Non-repudiation", keyAlgorithm: "Key algorithm", rsa: "RSA · widest compatibility", ecdsa: "ECDSA · smaller key", validDays: "Certificate validity in days", description: "Notes", saveServer: "Save server", cancel: "Cancel", reviewRenewal: "Review the details below before issuance. The current CA will sign this certificate.", reviewConfirmed: "I reviewed the CN, SAN, key usage and validity.", serverIssueTitle: "Issue server certificate", serverIssueSubtitle: "A new private key and password-protected PFX/P12 will be downloaded.", certificatePassword: "Certificate / PFX password", reenterPassword: "Confirm password", pfxHint: "Use this password when installing the certificate in IIS or Tomcat. The app does not store it.",
    status: "STATUS", active: "Active", expiring: "Expiring soon", expired: "Expired", notIssued: "Not issued", reviewNeeded: "Review needed", caChanged: "CA changed", pending: "Pending approval", disabled: "Disabled", rejected: "Rejected", certificateActive: "Certificate is valid.", certificateExpiring: "Certificate expires soon.", certificateExpired: "Certificate has expired.", certificateMissing: "No certificate issued yet.", parametersChanged: "Parameters changed — renew this certificate.", issuerChanged: "The CA changed — renew this certificate.",
    userTitle: "User management", usersSubtitle: "Approve requests and manage application access.", addUser: "Add user", pendingRequests: "Awaiting approval", activeUsers: "Active accounts", totalUsers: "Total accounts", noUsers: "No other users yet", noUsersText: "Create an account manually or allow registration requests.", approve: "Approve", reject: "Reject", manage: "Manage account", userFormNew: "New user", userFormEdit: "Edit user", accountStatus: "Account status", role: "Role", newPassword: "New password", passwordKeepHint: "Leave blank to keep the current password.", createUser: "Create user", saveChanges: "Save changes", requestAccess: "Request access", requestAccessText: "The account is enabled after administrator approval.", submitRequest: "Submit request", registrationSent: "Your request was sent. Wait for administrator approval.", approvalRequired: "Your account is waiting for administrator approval.", accountDisabled: "This account is disabled.",
    settingsTitle: "Application settings", settingsSubtitle: "Configure email notifications, registration and application operations.", operationalLogs: "Application logs", operationalLogsHelp: "Recent application warnings and errors. Details include the request reference and stack trace; passwords and private key contents are not recorded.", refreshLogs: "Refresh logs", noLogs: "No warnings or errors have been recorded yet.", logDetails: "Technical details", logReference: "Request ID", smtpSettings: "Outgoing mail", smtpSecurity: "Credentials are encrypted. The application does not require an external SMTP service.", testEmail: "Test email", testEmailAddress: "Send a test to", sendTest: "Send test", testEmailSent: "The test email was sent.", testSmtpHint: "Save SMTP settings first. Leave the password blank for anonymous SMTP.", registrationTitle: "User registration", registrationHelp: "Registered accounts cannot access the app until an administrator approves them.", smtpSaved: "SMTP settings saved.", registrationOn: "Registration requests are enabled.", registrationOff: "Public registration requests are disabled.",
    exportTitle: "Export certificate", exportSubtitle: "Choose the format for your target server.", exportPassword: "Password for the protected file", exportKeyWarning: "The private key is leaving the application. Store the downloaded file securely.", downloadFile: "Download file", formatPem: "PEM certificate", formatDer: "DER certificate", formatCrt: "CRT certificate", formatP7b: "PKCS#7 / P7B", formatP12: "PKCS#12 / P12", formatPfx: "PFX for IIS", formatKey: "Encrypted private key", importing: "Import CA", importPfx: "PFX / P12 file", importCertificate: "Public certificate PEM / DER", importKey: "Private key PEM", importKeyPassword: "Imported key password", chooseFile: "Choose file", importAuthorityAction: "Import CA", importModePfx: "Use an existing PFX / P12", importModePair: "Certificate and key separately", caGenerateForm: "New CA parameters", caKeyPassword: "CA key export password", caValidity: "CA validity in days", rsaBits: "RSA key size", caCreated: "Certificate authority is ready.", caImportedSuccess: "Existing CA imported.", caImportedSame: "The same CA was imported. Its certificate and key are unchanged.", caImportedSameKey: "The CA certificate changed but its public key is unchanged. Check the CA fingerprint and server certificate statuses.", caImportedNewKey: "The imported CA has a different key. Renew server certificates and distribute the new root.", caExportReady: "CA backup P12 downloaded.", serverCreated: "Server added.", serverUpdated: "Server updated.", certificateIssued: "Certificate issued and PFX/P12 downloaded.",
    confirmationTitle: "Confirm action", confirmDeleteServer: "Remove this server and its saved certificate? This cannot be undone.", confirmDeleteUser: "Remove this user?", confirmRejectUser: "Reject this access request?", confirmAction: "Confirm", serverDeleted: "Server removed.", userApproved: "Account approved.", userRejected: "Request rejected.", userSaved: "Account saved.", userCreated: "User created.",
    error_generic: "The action could not be completed.", error_invalid_setup_details: "Enter your name, a valid email address and language.", error_invalid_registration: "Check the user ID, name, email and language.", error_invalid_user_details: "Check the user's name, email and language.", error_invalid_password: "Password does not meet the requirements.", error_password_too_short: "Use at least 12 characters (14 for the administrator account).", error_password_mismatch: "The passwords do not match.", error_conflict: "An account with this ID already exists.", error_account_locked: "Too many failed attempts. Try again later.", error_approval_required: "Your request is waiting for administrator approval.", error_account_disabled: "This account is disabled. Contact an administrator.", error_invalid_language: "Choose Czech or English.", error_invalid_server_name: "Enter a server name.", error_invalid_server_type: "Choose IIS or Tomcat.", error_invalid_common_name: "Check the Common Name (CN).", error_invalid_country: "Country code must have two letters, for example US.", error_invalid_dns_name: "Check the DNS name or its IDN spelling.", error_invalid_ip_address: "Enter a valid IPv4 or IPv6 address without an interface zone, for example 2001:db8::25.", error_san_required: "Enter at least one DNS or IP alternate name.", error_invalid_certificate_validity: "Server certificate validity must be 1 to 825 days.", error_invalid_ca_validity: "CA validity must be 365 to 3650 days.", error_missing_key_usage: "Select at least one key usage.", error_invalid_key_algorithm: "Choose a supported RSA or ECDSA key algorithm.", error_unsupported_ca_key: "The CA private key is not supported. Use RSA or ECDSA.", error_unsupported_key_algorithm: "The selected key algorithm is not supported.", error_certificate_export_failed: "The certificate could not be packaged in the requested format. Check the password and key store.", error_private_key_missing: "The certificate has no private key.", error_upload_too_large: "The uploaded file is larger than the 10 MB limit.", error_too_many_san_entries: "Too many alternate names (the limit is 100).", error_ca_not_configured: "Configure a certificate authority first.", error_ca_expired: "The imported CA has expired.", error_ca_not_yet_valid: "The imported CA is not valid yet.", error_certificate_not_ca: "The certificate is missing CA:TRUE.", error_ca_cannot_sign: "The certificate is missing Key Cert Sign permission.", error_ca_pfx_missing_private_key: "The PFX does not contain the CA private key.", error_missing_ca_pair: "Choose the public CA certificate and private key.", error_missing_pfx: "Choose a PFX/P12 file.", error_ca_key_password_or_format_invalid: "The private key password or format is incorrect.", error_ca_key_or_format_invalid: "The private key format is not supported.", error_ca_import_failed: "The CA could not be loaded. Check the files and password.", error_private_key_mismatch: "The private key does not match the selected certificate.", error_ca_replacement_confirmation_required: "Confirm the warning before replacing the CA.", error_review_required: "Confirm the parameter review before issuance.", error_certificate_not_issued: "This server does not have an issued certificate yet.", error_export_password_required: "This export requires a password.", error_unsupported_export_format: "Choose a supported export format.", error_invalid_smtp_settings: "Check the SMTP host, port and sender address.", error_smtp_not_configured: "Save the SMTP settings first.", error_invalid_email: "Enter a valid email address.", error_last_active_admin: "At least one active administrator must remain.", error_cannot_remove_own_admin_access: "You cannot remove your own administrator account.", error_cannot_delete_self: "You cannot remove the account currently signed in.", error_user_not_pending: "This account is no longer awaiting approval.", error_delete_confirmation_required: "Confirm the removal.", error_invalid_user_status: "Choose a valid account status.", error_setup_already_completed: "First-run setup is complete. Sign in as the administrator.", error_csrf_header_required: "The request expired. Refresh the page and try again.", error_server_error: "A server error occurred. Try again.", error_server_error_reference: "A server error occurred (ID {id}). Open Settings → Application logs for the technical details.", error_unauthenticated: "Your sign-in expired. Please sign in again.",
    footerVersion: "Secure internal certificate management", saved: "Saved", loading: "Loading…", viewDetails: "Details", notConfigured: "Not configured", yes: "Yes", no: "No", required: "Required", optional: "Optional", passwordShow: "Show password", passwordHide: "Hide password", savedPassword: "A password is saved. Enter a new one to change it.", owner: "Administrator", userStatus: "Status", languageSaved: "Language updated.", registrationPendingTitle: "Awaiting approval", registrationPendingText: "The administrator received your request. Sign in after it is approved.", registrationDisabled: "Registration is disabled.", close: "Close", copy: "Copy", copied: "Copied", serverDetails: "Server parameters", cannotDownload: "The file could not be downloaded.", error_invalid_credentials: "The user ID or password is incorrect.",
  }
};

const icons = {
  shield: '<path d="M12 3 20 6v5.5c0 5.2-3.3 8.5-8 10.5-4.7-2-8-5.3-8-10.5V6l8-3Z"/><path d="m8.5 12.2 2.2 2.2 4.8-5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  server: '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01M12 7.5h4M12 16.5h4"/>',
  certificate: '<rect x="5" y="3" width="14" height="15" rx="2"/><path d="M8 7h8M8 10.5h8M9 18l-1 3 4-2 4 2-1-3"/>',
  users: '<path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20"/><circle cx="10" cy="7.5" r="3.5"/><path d="M17 4.5a3.5 3.5 0 0 1 0 6.8M20 20v-1.5a4.5 4.5 0 0 0-3-4.2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8 2 2-2 2 1.5 1.5-2 2L17 10l-3 3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  edit: '<path d="m14 5 5 5M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  warning: '<path d="m10.3 4.5-8 14A1.7 1.7 0 0 0 3.8 21h16.4a1.7 1.7 0 0 0 1.5-2.5l-8-14a1.7 1.7 0 0 0-3 0Z"/><path d="M12 9v4m0 4h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 4.1M6.3 6.3C3.5 8.2 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.6"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  shieldCheck: '<path d="M12 3 20 6v5.5c0 5.2-3.3 8.5-8 10.5-4.7-2-8-5.3-8-10.5V6l8-3Z"/><path d="m8.5 12.2 2.2 2.2 4.8-5"/>',
  globeLock: '<circle cx="10.5" cy="12" r="8"/><path d="M2.5 12h16m-8-8a13 13 0 0 1 0 16m0-16a13 13 0 0 0 0 16M15 15.5v-1a2 2 0 0 1 4 0v1"/><rect x="14" y="15.5" width="6" height="5" rx="1"/>'
};

const appRoot = document.getElementById('app');
const dialog = document.getElementById('dialog');
let language = localStorage.getItem('caweb-language') === 'en' ? 'en' : 'cs';
let state = null;
let overview = null;
let users = [];
let settings = null;
let applicationLogs = [];
let screen = 'loading';
let setupStep = 1;
let setupDraft = {};
let currentTab = 'overview';
let serverQuery = '';
let serverStatusFilter = 'all';
let pendingFilesMode = 'pfx';

const t = (key) => text[language]?.[key] ?? text.en[key] ?? key;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const icon = (name, extra = '') => `<span class="icon ${extra}" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[name] ?? icons.info}</svg></span>`;
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || 'CA';
const formatDate = (value, includeTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'cs' ? 'cs-CZ' : 'en-GB', includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date);
};
const statusClass = (value) => ({ active: 'active', expiring: 'expiring', expired: 'expired', 'not-issued': 'not-issued', review: 'review', 'ca-changed': 'ca-changed', pending: 'pending', disabled: 'disabled', rejected: 'rejected' }[value] ?? 'disabled');
const statusText = (value) => ({ active: t('active'), expiring: t('expiring'), expired: t('expired'), 'not-issued': t('notIssued'), review: t('reviewNeeded'), 'ca-changed': t('caChanged'), pending: t('pending'), disabled: t('disabled'), rejected: t('rejected') }[value] ?? value);
const errorText = (code) => t(`error_${code}`) === `error_${code}` ? t('error_generic') : t(`error_${code}`);
const showToast = (message, type = 'success') => {
  const root = document.getElementById('toast-region');
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.innerHTML = `${icon(type === 'error' ? 'warning' : 'check')}<span>${esc(message)}</span>`;
  root.append(node);
  setTimeout(() => node.remove(), 4200);
};

async function request(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers ?? {});
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers.set('X-CAWeb-Request', '1');
  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }
  const appBase = document.querySelector('base')?.href ?? `${location.origin}/`;
  const requestUrl = new URL(String(path).replace(/^\/+/, ''), appBase);
  const response = await fetch(requestUrl, { ...options, method, headers, credentials: 'same-origin' });
  if (response.status === 401 && screen === 'app') {
    state = await fetchStatus().catch(() => null);
    screen = state?.setupRequired ? 'setup' : 'login';
    render();
  }
  if (!response.ok) {
    let body = {};
    try { body = await response.json(); } catch { /* response did not include a JSON error */ }
    const error = new Error(body.error ?? 'generic');
    error.referenceId = body.referenceId ?? null;
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') ?? '';
  return type.includes('application/json') ? response.json() : response;
}

async function fetchStatus() { return request('/api/status'); }
async function refreshOverview() { overview = await request('/api/overview'); state = { ...state, ...overview, user: overview.user }; language = overview.user.language; localStorage.setItem('caweb-language', language); }
async function refresh() {
  await refreshOverview();
  if (currentTab === 'users' && overview.user.role === 'admin') users = await request('/api/users');
  if (currentTab === 'settings' && overview.user.role === 'admin') {
    [settings, applicationLogs] = await Promise.all([request('/api/settings'), request('/api/logs')]);
  }
  render();
}

async function initialize() {
  try {
    state = await fetchStatus();
    if (state.user?.language) language = state.user.language;
    else if (localStorage.getItem('caweb-language') === 'en') language = 'en';
    localStorage.setItem('caweb-language', language);
    if (state.setupRequired) {
      screen = 'setup';
      setupStep = 1;
      render();
      return;
    }
    if (state.authenticated) {
      screen = 'app';
      await refresh();
      return;
    }
    screen = 'login';
  } catch {
    screen = 'offline';
  }
  render();
}

function languageControl() {
  return `<div class="language-control" role="group" aria-label="${esc(t('language'))}">
    <button type="button" data-action="language" data-language="cs" class="${language === 'cs' ? 'active' : ''}" aria-pressed="${language === 'cs'}">CZ</button>
    <button type="button" data-action="language" data-language="en" class="${language === 'en' ? 'active' : ''}" aria-pressed="${language === 'en'}">EN</button>
  </div>`;
}

function brand(aside = false) {
  return `<div class="brand-lockup"><span class="brand-mark">${icon('shieldCheck')}</span><span><span class="brand-title">CAWeb</span><span class="brand-caption">${esc(t('productLong'))}</span></span></div>`;
}

function authAside() {
  return `<aside class="auth-aside"><div>${brand(true)}</div><div class="auth-aside-copy"><p class="eyebrow">CAWEB · CERTIFICATE MANAGER</p><h1>${esc(t('welcomeHeading'))}</h1><p>${esc(t('welcomeText'))}</p><ul class="security-points"><li>${icon('lock')}${esc(t('privateStorage'))}</li><li>${icon('shieldCheck')}${esc(t('approvalGate'))}</li><li>${icon('certificate')}${esc(t('formats'))}</li></ul></div><div class="auth-footer">${esc(t('localFirst'))}</div></aside>`;
}

function renderLogin() {
  appRoot.innerHTML = `<section class="auth-page">${authAside()}<div class="auth-content"><div class="auth-card"><div class="auth-switch">${brand()}${languageControl()}</div><header class="auth-card-head"><p class="eyebrow">CAWEB</p><h2>${esc(t('loginTitle'))}</h2><p>${esc(t('loginSubtitle'))}</p></header>
    <form id="login-form" class="form-grid one"><div class="field"><label for="login-username">${esc(t('username'))}</label><input class="input" id="login-username" name="username" autocomplete="username" value="admin" required maxlength="64"></div><div class="field"><label for="login-password">${esc(t('password'))}</label>${passwordInput('password', 'login-password', 'current-password')}</div><button class="btn primary block" type="submit">${esc(t('signIn'))}<span aria-hidden="true">→</span></button></form>
    <div class="divider"></div><div class="auth-note">${icon('info')}<span>${esc(t('signInHint'))}</span></div>${state?.registrationEnabled ? `<p style="margin:22px 0 0;text-align:center;color:var(--muted);font-size:11px">${esc(t('noAccount'))} <button type="button" class="inline-button" data-action="register">${esc(t('createAccount'))}</button></p>` : ''}</div></div></section>`;
}

function passwordInput(name, id, autocomplete, value = '', placeholder = '', required = true) {
  return `<div class="password-wrap"><input class="input" id="${esc(id)}" name="${esc(name)}" type="password" autocomplete="${esc(autocomplete)}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}><button class="password-reveal" type="button" data-action="toggle-password" data-target="${esc(id)}" aria-label="${esc(t('passwordShow'))}">${icon('eye')}</button></div>`;
}

function renderSetup() {
  const steps = [t('stepAdmin'), t('stepEmail'), t('stepFinish')];
  appRoot.innerHTML = `<section class="auth-page">${authAside()}<div class="auth-content"><div class="auth-card wide"><div class="auth-switch">${brand()}${languageControl()}</div><header class="auth-card-head"><p class="eyebrow">${esc(t('administratorAccount'))}</p><h2>${esc(t('setupTitle'))}</h2><p>${esc(t('setupSubtitle'))}</p></header><div class="wizard-progress">${steps.map((label, index) => `<div class="wizard-step ${setupStep === index + 1 ? 'active' : setupStep > index + 1 ? 'done' : ''}"><span class="number">${setupStep > index + 1 ? '✓' : index + 1}</span><span>${esc(label)}</span></div>${index < steps.length - 1 ? '<span class="wizard-line"></span>' : ''}`).join('')}</div>${setupStep === 1 ? setupAdminForm() : setupStep === 2 ? setupSmtpForm() : setupFinishForm()}</div></div></section>`;
}

function setupAdminForm() {
  return `<form id="setup-admin-form" class="form-grid"><div class="field full"><label for="setup-username">${esc(t('username'))}</label><input class="input" id="setup-username" value="admin" readonly aria-readonly="true"></div><div class="field"><label for="setup-name">${esc(t('fullName'))}</label><input class="input" id="setup-name" name="fullName" autocomplete="name" required maxlength="120" value="${esc(setupDraft.fullName ?? '')}"></div><div class="field"><label for="setup-email">${esc(t('email'))}</label><input class="input" id="setup-email" name="email" type="email" autocomplete="email" required maxlength="254" value="${esc(setupDraft.email ?? '')}"></div><div class="field"><label for="setup-password">${esc(t('password'))}</label>${passwordInput('password', 'setup-password', 'new-password', setupDraft.password ?? '')}<span class="hint">${esc(language === 'cs' ? 'Minimálně 14 znaků.' : 'At least 14 characters.')}</span></div><div class="field"><label for="setup-confirm">${esc(t('confirmPassword'))}</label>${passwordInput('confirmPassword', 'setup-confirm', 'new-password', setupDraft.confirmPassword ?? '')}</div><div class="field"><label for="setup-language">${esc(t('language'))}</label><select class="select" id="setup-language" name="language"><option value="cs" ${language === 'cs' ? 'selected' : ''}>Čeština</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option></select></div><div class="field full"><div class="callout">${icon('lock')}<span>${esc(language === 'cs' ? 'Účet „admin“ bude vytvořen až po tomto průvodci. Heslo se ukládá pouze jako bezpečný hash.' : 'The “admin” account is created when this wizard completes. The password is stored only as a secure hash.')}</span></div></div><div class="field full form-actions end"><button class="btn primary" type="submit">${esc(t('next'))} <span aria-hidden="true">→</span></button></div></form>`;
}

function setupSmtpForm() {
  return `<form id="setup-smtp-form" class="form-grid"><h3 class="form-section-title">${esc(t('smtpSetup'))}</h3><div class="field"><label for="smtp-host">${esc(t('smtpHost'))}</label><input class="input" id="smtp-host" name="smtpHost" autocomplete="off" maxlength="253" placeholder="smtp.example.com" value="${esc(setupDraft.smtpHost ?? '')}"></div><div class="field"><label for="smtp-port">${esc(t('smtpPort'))}</label><input class="input" id="smtp-port" name="smtpPort" type="number" min="1" max="65535" value="${esc(setupDraft.smtpPort ?? '587')}"></div><div class="field"><label for="smtp-from">${esc(t('smtpFrom'))}</label><input class="input" id="smtp-from" name="smtpFrom" type="email" maxlength="254" placeholder="certificates@example.com" value="${esc(setupDraft.smtpFrom ?? '')}"></div><div class="field"><label for="smtp-username">${esc(t('smtpUsername'))}</label><input class="input" id="smtp-username" name="smtpUsername" autocomplete="username" value="${esc(setupDraft.smtpUsername ?? '')}"></div><div class="field"><label for="smtp-password">${esc(t('smtpPassword'))}</label>${passwordInput('smtpPassword', 'smtp-password', 'new-password', setupDraft.smtpPassword ?? '', '', false)}</div><div class="field full"><label class="checkbox-row"><input type="checkbox" name="smtpUseTls" ${setupDraft.smtpUseTls !== false ? 'checked' : ''}><span>${esc(t('tls'))}</span></label></div><div class="field full"><div class="callout">${icon('info')}<span>${esc(t('skipSmtp'))} ${esc(t('smtpPasswordHint'))}</span></div></div><div class="field full form-actions"><button class="btn secondary" type="button" data-action="setup-back">${esc(t('back'))}</button><button class="btn primary" type="submit">${esc(t('next'))} <span aria-hidden="true">→</span></button></div></form>`;
}

function setupFinishForm() {
  return `<form id="setup-finish-form" class="form-grid"><div class="field full"><div class="callout success">${icon('shieldCheck')}<span><strong>${esc(t('completionTitle'))}</strong><br>${esc(t('completionText'))}</span></div></div><div class="field full"><div class="meta-grid"><div class="meta-item"><div class="meta-label">${esc(t('username'))}</div><div class="meta-value">admin</div></div><div class="meta-item"><div class="meta-label">${esc(t('email'))}</div><div class="meta-value">${esc(setupDraft.email ?? '—')}</div></div><div class="meta-item"><div class="meta-label">${esc(t('language'))}</div><div class="meta-value">${language === 'cs' ? 'Čeština' : 'English'}</div></div><div class="meta-item"><div class="meta-label">${esc(t('smtpSetup'))}</div><div class="meta-value">${setupDraft.smtpHost ? esc(setupDraft.smtpHost) : esc(t('notConfigured'))}</div></div></div></div><div class="field full form-actions"><button class="btn secondary" type="button" data-action="setup-back">${esc(t('back'))}</button><button class="btn primary" type="submit">${esc(t('finishSetup'))} <span aria-hidden="true">→</span></button></div></form>`;
}

function renderRegisterDialog() {
  dialog.innerHTML = dialogFrame(t('requestAccess'), t('requestAccessText'), `<form id="register-form" class="form-grid"><div class="field"><label>${esc(t('username'))}</label><input class="input" name="username" required minlength="3" maxlength="64" pattern="[A-Za-z0-9._-]+" autocomplete="username"></div><div class="field"><label>${esc(t('fullName'))}</label><input class="input" name="fullName" required maxlength="120" autocomplete="name"></div><div class="field"><label>${esc(t('email'))}</label><input class="input" type="email" name="email" required maxlength="254" autocomplete="email"></div><div class="field"><label>${esc(t('language'))}</label><select class="select" name="language"><option value="cs" ${language === 'cs' ? 'selected' : ''}>Čeština</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option></select></div><div class="field"><label>${esc(t('password'))}</label>${passwordInput('password', 'register-password', 'new-password')}</div><div class="field full"><div class="callout">${icon('info')}<span>${esc(t('requestAccessText'))}</span></div></div><div class="field full form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${esc(t('submitRequest'))}</button></div></form>`);
  dialog.showModal();
}

function renderOffline() {
  appRoot.innerHTML = `<section class="auth-page">${authAside()}<div class="auth-content"><div class="auth-card"><div class="auth-switch">${brand()}${languageControl()}</div><div class="callout danger">${icon('warning')}<span>${esc(t('error_server_error'))}</span></div><div class="form-actions end"><button class="btn primary" data-action="retry" type="button">${esc(language === 'cs' ? 'Zkusit znovu' : 'Try again')}</button></div></div></div></section>`;
}

function render() {
  document.documentElement.lang = language;
  if (screen === 'loading') appRoot.innerHTML = `<div class="auth-content"><span class="skeleton" style="width:190px;height:24px"></span></div>`;
  else if (screen === 'setup') renderSetup();
  else if (screen === 'login') renderLogin();
  else if (screen === 'offline') renderOffline();
  else renderApplication();
}

const pageMeta = {
  overview: ['overviewTitle', 'overviewSubtitle'],
  servers: ['serversTitle', 'serversSubtitle'],
  authority: ['caTitle', 'caSubtitle'],
  users: ['userTitle', 'usersSubtitle'],
  settings: ['settingsTitle', 'settingsSubtitle']
};

function renderApplication() {
  if (!overview?.user) return;
  const admin = overview.user.role === 'admin';
  if (!admin && ['authority', 'users', 'settings'].includes(currentTab)) currentTab = 'overview';
  const [titleKey, subtitleKey] = pageMeta[currentTab] ?? pageMeta.overview;
  const pending = overview.counts?.pendingUsers ?? 0;
  appRoot.innerHTML = `<div class="app-layout"><aside class="sidebar" id="sidebar">${brand()}<div class="sidebar-nav-label">${esc(t('navWorkspace'))}</div><nav class="sidebar-nav" aria-label="${esc(t('navWorkspace'))}">${navButton('overview', 'grid', 'navOverview')}${navButton('servers', 'server', 'navServers')}${admin ? navButton('authority', 'certificate', 'navAuthority') : ''}</nav>${admin ? `<div class="sidebar-divider"></div><div class="sidebar-nav-label">${esc(t('navAdministration'))}</div><nav class="sidebar-nav" aria-label="${esc(t('navAdministration'))}">${navButton('users', 'users', 'navUsers', pending)}${navButton('settings', 'settings', 'navSettings')}</nav>` : ''}<div class="sidebar-bottom"><div class="sidebar-divider"></div><div class="sidebar-user"><span class="avatar">${esc(initials(overview.user.fullName))}</span><div class="sidebar-user-text"><div class="sidebar-user-name">${esc(overview.user.fullName)}</div><div class="sidebar-user-role">${esc(t(admin ? 'adminRole' : 'userRole'))}</div></div><button class="sidebar-logout" data-action="logout" type="button" aria-label="${esc(t('signOut'))}" title="${esc(t('signOut'))}">${icon('logout')}</button></div><div class="side-footer">${esc(t('footerVersion'))} · v${esc(state?.version ?? '0.1.0')}</div></div></aside>
    <div class="main-column"><header class="topbar"><button class="mobile-menu" type="button" data-action="menu" aria-label="Menu">${icon('menu')}</button><div class="topbar-title"><h1>${esc(t(titleKey))}</h1><p>${esc(t(subtitleKey))}</p></div><div class="topbar-actions">${languageControl()}<div class="topbar-profile"><span class="avatar">${esc(initials(overview.user.fullName))}</span><span class="topbar-profile-name">${esc(overview.user.fullName)}</span></div></div></header><div class="page-content">${renderActivePage()}</div></div></div>`;
}

function navButton(tab, symbol, label, badge = 0) {
  return `<button class="nav-item ${currentTab === tab ? 'active' : ''}" type="button" data-action="tab" data-tab="${tab}" ${currentTab === tab ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${esc(t(label))}</span>${badge > 0 ? `<span class="nav-badge">${badge}</span>` : ''}</button>`;
}

function renderActivePage() {
  if (currentTab === 'servers') return renderServers();
  if (currentTab === 'authority') return renderAuthority();
  if (currentTab === 'users') return renderUsers();
  if (currentTab === 'settings') return renderSettings();
  return renderOverview();
}

function statCard(label, value, note, symbol, color = '') {
  return `<article class="card stat-card"><div><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-note">${esc(note)}</div></div><span class="stat-icon ${color}">${icon(symbol)}</span></article>`;
}

function localizedAuditAction(action) {
  const labels = {
    created: ['Vytvořeno', 'Created'], renewed: ['Obnoveno', 'Renewed'], imported: ['Importováno', 'Imported'],
    exported: ['Exportováno', 'Exported'], updated: ['Upraveno', 'Updated'], requested: ['Požádáno', 'Requested'],
    duplicated: ['Duplikováno', 'Duplicated'], deleted: ['Odebráno', 'Removed'], issued: ['Vydáno', 'Issued'],
    approved: ['Schváleno', 'Approved'], rejected: ['Zamítnuto', 'Rejected']
  };
  return labels[action]?.[language === 'cs' ? 0 : 1] ?? action;
}

function localizedAuditDetail(detail) {
  const labels = {
    'First-run setup completed.': ['Dokončeno první nastavení.', 'First-run setup completed.'],
    'Registration request submitted for approval.': ['Žádost o registraci čeká na schválení.', 'Registration request is awaiting approval.'],
    'SMTP and registration settings updated.': ['Nastavení SMTP a registrace bylo upraveno.', 'SMTP and registration settings updated.']
  };
  return labels[detail]?.[language === 'cs' ? 0 : 1] ?? detail;
}

function renderOverview() {
  const ca = overview.authority;
  const counts = overview.counts;
  const now = new Date();
  const hour = now.getHours();
  const greeting = language === 'cs' ? (hour < 11 ? 'Dobré ráno' : hour >= 18 ? 'Dobrý večer' : t('greeting')) : (hour < 11 ? 'Good morning' : hour >= 18 ? 'Good evening' : t('greeting'));
  const caInfo = ca ? `<article class="card hero-card"><div class="hero-copy"><p class="eyebrow">${esc(t('overviewEyebrow'))}</p><h2>${esc(t('overviewHero'))}</h2><p>${esc(t('overviewHeroText'))}</p></div><div class="hero-meta"><div class="hero-meta-item"><div class="hero-meta-label">${esc(t('issuerLabel'))}</div><div class="hero-meta-value">${esc(ca.subject)}</div></div><div class="hero-divider"></div><div class="hero-meta-item"><div class="hero-meta-label">${esc(t('expiryLabel'))}</div><div class="hero-meta-value">${formatDate(ca.notAfter)}</div></div></div></article>` : `<article class="card hero-card"><div class="hero-copy"><p class="eyebrow">${esc(t('overviewEyebrow'))}</p><h2>${esc(t('noAuthority'))}</h2><p>${esc(t('caMissingText'))}</p></div><div class="hero-meta"><button class="btn secondary" type="button" data-action="tab" data-tab="authority">${esc(t('configureAuthority'))} <span aria-hidden="true">→</span></button></div></article>`;
  const serverCards = overview.servers.slice(0, 5).map(server => `<div class="mini-row"><span class="mini-icon">${icon('server')}</span><div class="mini-row-main"><div class="mini-row-title">${esc(server.name)}</div><div class="mini-row-sub">${esc(server.commonName)}</div></div><span class="status ${statusClass(server.status)}">${esc(statusText(server.status))}</span></div>`).join('');
  const activity = overview.recentActivity?.length ? overview.recentActivity.slice(0, 6).map(item => `<div class="activity-row"><span class="activity-dot"></span><div class="activity-copy">${esc(item.username)} · ${esc(localizedAuditAction(item.action))} <div class="activity-detail">${esc(localizedAuditDetail(item.detail))}</div></div><span class="activity-time">${formatDate(item.createdAt, true)}</span></div>`).join('') : `<div class="empty-state" style="min-height:100px;padding:12px">${esc(t('noActivity'))}</div>`;
  return `<section class="page-heading"><div><h2>${esc(greeting)}, ${esc(overview.user.fullName.split(' ')[0])}</h2><p>${esc(t('overviewSubtitle'))}</p></div><div class="heading-actions"><button class="btn secondary" data-action="tab" data-tab="servers">${icon('server')}${esc(t('navServers'))}</button></div></section>${caInfo}<section class="card-grid">${statCard(t('serversTotal'), counts.servers, t('serversTotalNote'), 'server')}${statCard(t('certificatesActive'), counts.activeCertificates, t('certificatesActiveNote'), 'shieldCheck', 'green')}${statCard(t('needsAttention'), counts.needsAttention, t('needsAttentionNote'), 'warning', counts.needsAttention ? 'amber' : 'green')}${overview.user.role === 'admin' ? statCard(t('waitingApprovals'), counts.pendingUsers, t('waitingApprovalsNote'), 'users', counts.pendingUsers ? 'amber' : 'green') : ''}</section>
    <section class="card-grid two" style="margin-top:15px"><article class="card panel-card"><div class="panel-card-head"><div><h3>${esc(t('serverOverview'))}</h3><p>${esc(t('serversSubtitle'))}</p></div><button class="btn ghost small" data-action="tab" data-tab="servers">${esc(t('allServers'))} →</button></div><div class="panel-card-body"><div class="mini-list">${serverCards || `<div class="empty-state" style="min-height:145px;padding:15px"><span>${esc(t('noServers'))}</span><button class="inline-button" data-action="new-server">${esc(t('addServer'))}</button></div>`}</div></div></article><article class="card panel-card"><div class="panel-card-head"><div><h3>${esc(t('recentActivity'))}</h3><p>${esc(t('footerVersion'))}</p></div>${icon('activity')}</div><div class="panel-card-body">${activity}</div></article></section>`;
}

function filteredServers() {
  const query = serverQuery.trim().toLocaleLowerCase(language === 'cs' ? 'cs-CZ' : 'en-GB');
  return (overview?.servers ?? []).filter(server => {
    const matches = !query || [server.name, server.commonName, server.serverType, ...server.dnsNames, ...server.ipAddresses].some(value => String(value ?? '').toLocaleLowerCase(language === 'cs' ? 'cs-CZ' : 'en-GB').includes(query));
    return matches && (serverStatusFilter === 'all' || server.status === serverStatusFilter);
  });
}

function renderServers() {
  const servers = filteredServers();
  const statusOptions = ['all', 'active', 'expiring', 'expired', 'not-issued', 'review', 'ca-changed'];
  return `<section class="page-heading"><div><h2>${esc(t('serversTitle'))}</h2><p>${esc(t('serversSubtitle'))}</p></div><div class="heading-actions"><button class="btn primary" type="button" data-action="new-server">${icon('plus')}${esc(t('addServer'))}</button></div></section><section class="table-shell"><div class="table-toolbar"><label class="search-box">${icon('search')}<span class="sr-only">${esc(t('searchServers'))}</span><input id="server-search" type="search" placeholder="${esc(t('searchServers'))}" value="${esc(serverQuery)}"></label><select class="filter-select" id="server-status-filter" aria-label="${esc(t('allStatuses'))}">${statusOptions.map(status => `<option value="${status}" ${serverStatusFilter === status ? 'selected' : ''}>${esc(status === 'all' ? t('allStatuses') : statusText(status))}</option>`).join('')}</select></div>${servers.length ? `<div class="table-scroll mobile-cards"><table class="data-table mobile-cards"><thead><tr><th>${esc(t('colServer'))}</th><th>${esc(t('colType'))}</th><th>${esc(t('colNames'))}</th><th>${esc(t('colStatus'))}</th><th>${esc(t('colExpiry'))}</th><th>${esc(t('colActions'))}</th></tr></thead><tbody>${servers.map(serverRow).join('')}</tbody></table></div>` : `<div class="empty-state"><div><span class="empty-state-icon">${icon('server')}</span><h3>${esc(overview.servers.length ? t('noMatch') : t('noServers'))}</h3><p>${esc(overview.servers.length ? t('noMatchText') : t('noServersText'))}</p>${overview.servers.length ? '' : `<button class="btn primary" data-action="new-server">${icon('plus')}${esc(t('addServer'))}</button>`}</div></div>`}</section>`;
}

function serverRow(server) {
  const names = [...new Set([...server.dnsNames, ...server.ipAddresses])];
  const tags = names.slice(0, 3).map(value => `<span class="tag" title="${esc(value)}">${esc(value)}</span>`).join('') + (names.length > 3 ? `<span class="tag">+${names.length - 3}</span>` : '');
  const cn = server.commonName ? `<div class="table-secondary">CN: ${esc(server.commonName)}</div>` : '';
  const status = statusText(server.status);
  const detailKey = ({ certificate_missing: 'certificateMissing', issuer_changed: 'issuerChanged', parameters_changed: 'parametersChanged', certificate_expired: 'certificateExpired', certificate_expiring: 'certificateExpiring', certificate_active: 'certificateActive' })[server.statusDetail];
  return `<tr><td data-label="${esc(t('colServer'))}"><div class="table-primary">${esc(server.name)}</div>${cn}</td><td data-label="${esc(t('colType'))}">${esc(server.serverType)}</td><td data-label="${esc(t('colNames'))}"><div class="tag-list">${tags || '—'}</div></td><td data-label="${esc(t('colStatus'))}"><span class="status ${statusClass(server.status)}" title="${esc(t(detailKey ?? ''))}">${esc(status)}</span></td><td data-label="${esc(t('colExpiry'))}">${formatDate(server.expiresAt)}</td><td data-label="${esc(t('colActions'))}"><div class="table-actions"><button class="btn secondary" data-action="edit-server" data-id="${esc(server.id)}" type="button" aria-label="${esc(t('edit'))}" title="${esc(t('edit'))}">${icon('edit')}</button><button class="btn secondary" data-action="duplicate-server" data-id="${esc(server.id)}" type="button" aria-label="${esc(t('duplicate'))}" title="${esc(t('duplicate'))}">${icon('duplicate')}</button><button class="btn primary" data-action="issue-server" data-id="${esc(server.id)}" type="button" aria-label="${esc(t('issue'))}" title="${esc(t('issue'))}">${icon('refresh')}</button><button class="btn secondary" data-action="export-server" data-id="${esc(server.id)}" type="button" aria-label="${esc(t('export'))}" title="${esc(t('export'))}">${icon('download')}</button><button class="btn danger" data-action="delete-server" data-id="${esc(server.id)}" type="button" aria-label="${esc(t('remove'))}" title="${esc(t('remove'))}">${icon('trash')}</button></div></td></tr>`;
}

function renderAuthority() {
  const ca = overview.authority;
  if (!ca) return `<section class="page-heading"><div><h2>${esc(t('caTitle'))}</h2><p>${esc(t('caSubtitle'))}</p></div></section><article class="card empty-state"><div><span class="empty-state-icon">${icon('certificate')}</span><h3>${esc(t('caMissing'))}</h3><p>${esc(t('caMissingText'))}</p><div class="heading-actions" style="justify-content:center"><button class="btn secondary" data-action="import-ca" type="button">${icon('download')}${esc(t('importExisting'))}</button><button class="btn primary" data-action="generate-ca" type="button">${icon('plus')}${esc(t('generateAuthority'))}</button></div><p style="margin-top:14px">${esc(t('importInfo'))}</p></div></article>`;
  const info = ca.isExpired ? `<div class="callout danger" style="margin-top:15px">${icon('warning')}<span>${esc(t('certificateExpired'))}</span></div>` : '';
  return `<section class="page-heading"><div><h2>${esc(t('caTitle'))}</h2><p>${esc(t('caSubtitle'))}</p></div><div class="heading-actions"><button class="btn secondary" data-action="import-ca" type="button">${icon('download')}${esc(t('importExisting'))}</button><button class="btn primary" data-action="generate-ca" type="button">${icon('refresh')}${esc(t('renewAuthority'))}</button></div></section><article class="card authority-hero"><span class="authority-seal">${icon('shieldCheck')}</span><div class="authority-info"><h3>${esc(ca.subject)}</h3><p>${esc(t(ca.imported ? 'imported' : 'generated'))} · ${esc(ca.keyAlgorithm)} · ${esc(t('expiryLabel').toLowerCase())} ${formatDate(ca.notAfter)}</p></div><span class="status ${ca.isExpired ? 'expired' : 'active'}">${esc(ca.isExpired ? t('expired') : t('caConfigured'))}</span></article>${info}<section class="card-grid three" style="margin-top:15px">${infoCard(t('authoritySubject'), ca.subject, 'certificate')}${infoCard(t('keyType'), ca.keyAlgorithm, 'key')}${infoCard(t('issuedServers'), String(ca.serverCount), 'server')}${infoCard(t('validity'), `${formatDate(ca.notBefore)} – ${formatDate(ca.notAfter)}`, 'clock')}${infoCard(t('fingerprint'), ca.thumbprint, 'shield')}${infoCard(t('publicKeyFingerprint'), ca.publicKeyFingerprint, 'key')}${infoCard(t('status'), ca.isExpired ? t('expired') : t('active'), 'lock')}</section><section class="card panel-card" style="margin-top:15px"><div class="panel-card-head"><div><h3>${esc(t('exportFiles'))}</h3><p>${esc(t('importInfo'))}</p></div>${icon('download')}</div><div class="panel-card-body"><div class="export-row">${exportButtons('ca')}</div></div></section>`;
}

function infoCard(label, value, symbol) {
  return `<article class="card panel-card"><div style="display:flex;align-items:center;gap:11px"><span class="mini-icon">${icon(symbol)}</span><div style="min-width:0"><div class="meta-label">${esc(label)}</div><div class="meta-value" title="${esc(value)}" style="margin-top:4px">${esc(value)}</div></div></div></article>`;
}

function exportButtons(target, id = '') {
  const formats = target === 'ca' ? ['pem', 'der', 'crt', 'p7b', 'p12', 'key'] : ['pem', 'der', 'crt', 'p7b', 'pfx', 'p12', 'key'];
  const labels = { pem: 'formatPem', der: 'formatDer', crt: 'formatCrt', p7b: 'formatP7b', p12: 'formatP12', pfx: 'formatPfx', key: 'formatKey' };
  return formats.map(format => `<button class="export-chip" type="button" data-action="download-${target}" data-id="${esc(id)}" data-format="${format}" title="${esc(t(labels[format]))}">${icon('download')}${esc(t(labels[format]))}</button>`).join('');
}

function renderUsers() {
  const pending = users.filter(user => user.status === 'pending');
  const active = users.filter(user => user.status === 'active');
  const cards = users.map(user => `<article class="card user-card"><div class="user-card-head"><span class="avatar">${esc(initials(user.fullName))}</span><div class="user-card-ident"><div class="user-card-name">${esc(user.fullName)}</div><div class="user-card-user">@${esc(user.username)}</div></div><span class="status ${statusClass(user.status)}">${esc(statusText(user.status))}</span></div><div class="user-card-meta"><div>${icon('mail')} ${esc(user.email)}</div><div>${esc(t(user.role === 'admin' ? 'adminRole' : 'userRole'))} · ${user.language === 'cs' ? 'Čeština' : 'English'}</div><div>${esc(t('userStatus'))}: ${esc(formatDate(user.createdAt))}</div></div><div class="user-card-actions">${user.status === 'pending' ? `<button class="btn primary small" data-action="approve-user" data-id="${esc(user.id)}">${icon('check')}${esc(t('approve'))}</button><button class="btn danger small" data-action="reject-user" data-id="${esc(user.id)}">${icon('x')}${esc(t('reject'))}</button>` : `<button class="btn secondary small" data-action="edit-user" data-id="${esc(user.id)}">${icon('edit')}${esc(t('manage'))}</button>`}</div></article>`).join('');
  return `<section class="page-heading"><div><h2>${esc(t('userTitle'))}</h2><p>${esc(t('usersSubtitle'))}</p></div><div class="heading-actions"><button class="btn primary" data-action="new-user" type="button">${icon('plus')}${esc(t('addUser'))}</button></div></section><section class="card-grid three" style="margin-bottom:15px">${statCard(t('totalUsers'), users.length, t('userTitle'), 'users')}${statCard(t('activeUsers'), active.length, t('active'), 'shieldCheck', 'green')}${statCard(t('pendingRequests'), pending.length, t('waitingApprovalsNote'), 'clock', pending.length ? 'amber' : 'green')}</section>${users.length ? `<section class="card-grid three">${cards}</section>` : `<article class="card empty-state"><div><span class="empty-state-icon">${icon('users')}</span><h3>${esc(t('noUsers'))}</h3><p>${esc(t('noUsersText'))}</p><button class="btn primary" data-action="new-user">${icon('plus')}${esc(t('addUser'))}</button></div></article>`}`;
}

function renderSettings() {
  const smtp = settings?.smtp ?? {};
  return `<section class="page-heading"><div><h2>${esc(t('settingsTitle'))}</h2><p>${esc(t('settingsSubtitle'))}</p></div></section><div class="settings-layout"><form id="settings-form" class="card panel-card"><div class="panel-card-head"><div><h3>${esc(t('smtpSettings'))}</h3><p>${esc(t('smtpSecurity'))}</p></div><span class="stat-icon">${icon('mail')}</span></div><div class="panel-card-body"><div class="form-grid"><div class="field"><label for="settings-host">${esc(t('smtpHost'))}</label><input class="input" id="settings-host" name="host" maxlength="253" value="${esc(smtp.host ?? '')}" placeholder="smtp.example.com"></div><div class="field"><label for="settings-port">${esc(t('smtpPort'))}</label><input class="input" id="settings-port" name="port" type="number" min="1" max="65535" value="${esc(smtp.port ?? 587)}"></div><div class="field"><label for="settings-from">${esc(t('smtpFrom'))}</label><input class="input" id="settings-from" name="fromAddress" type="email" value="${esc(smtp.fromAddress ?? '')}" placeholder="certificates@example.com"></div><div class="field"><label for="settings-username">${esc(t('smtpUsername'))}</label><input class="input" id="settings-username" name="username" value="${esc(smtp.username ?? '')}" autocomplete="username"></div><div class="field full"><label for="settings-password">${esc(t('smtpPassword'))}</label><input class="input" id="settings-password" type="password" name="password" autocomplete="new-password" placeholder="${esc(smtp.passwordSet ? t('savedPassword') : '')}"><span class="hint">${esc(t('smtpPasswordHint'))}</span></div><div class="field full"><label class="checkbox-row"><input type="checkbox" name="useTls" ${smtp.useTls !== false ? 'checked' : ''}><span>${esc(t('tls'))}</span></label></div><div class="field full"><h3 class="form-section-title">${esc(t('registrationTitle'))}</h3><label class="checkbox-row"><input type="checkbox" name="registrationEnabled" ${settings.registrationEnabled ? 'checked' : ''}><span><strong>${esc(t('registration'))}</strong><br><span style="color:var(--muted);font-size:10px">${esc(t('registrationHelp'))}</span></span></label></div><div class="field full form-actions end"><button class="btn primary" type="submit">${esc(t('saveChanges'))}</button></div></div></div></form><aside class="settings-help"><article class="card panel-card"><div class="panel-card-head"><div><h3>${esc(t('testEmail'))}</h3><p>${esc(t('testSmtpHint'))}</p></div>${icon('activity')}</div><div class="panel-card-body"><form id="test-email-form" class="form-grid one"><div class="field"><label for="test-email-address">${esc(t('testEmailAddress'))}</label><input class="input" id="test-email-address" name="recipient" type="email" required value="${esc(overview.user.email)}"></div><button class="btn secondary" type="submit">${icon('mail')}${esc(t('sendTest'))}</button></form></div></article><article class="card panel-card"><div class="panel-card-head"><div><h3>${esc(language === 'cs' ? 'Jazyk vašeho účtu' : 'Your account language')}</h3><p>${esc(language === 'cs' ? 'Každý uživatel si může zvolit vlastní jazyk.' : 'Each user can choose a personal language.')}</p></div>${icon('globe')}</div><div class="panel-card-body">${languageControl()}</div></article><div class="callout">${icon('lock')}<span>${esc(t('privateStorage'))}<br>${esc(t('importInfo'))}</span></div></aside></div>${renderOperationalLogs()}`;
}

function renderOperationalLogs() {
  const entries = applicationLogs.map(item => `<article class="operational-log"><div class="operational-log-head"><strong>${esc(item.level)} · ${formatDate(item.timestamp, true)}</strong>${item.referenceId ? `<span>${esc(t('logReference'))}: ${esc(item.referenceId)}</span>` : ''}</div><div class="operational-log-message">${esc(item.category)} · ${esc(item.message)}</div>${item.exceptionDetails ? `<details><summary>${esc(t('logDetails'))}${item.exceptionType ? ` · ${esc(item.exceptionType)}` : ''}</summary><pre>${esc(item.exceptionDetails)}</pre></details>` : ''}</article>`).join('');
  return `<section class="card panel-card operational-logs"><div class="panel-card-head"><div><h3>${esc(t('operationalLogs'))}</h3><p>${esc(t('operationalLogsHelp'))}</p></div><button class="btn secondary small" type="button" data-action="refresh-logs">${icon('refresh')}${esc(t('refreshLogs'))}</button></div><div class="panel-card-body"><div class="operational-log-list">${entries || `<p class="operational-logs-empty">${esc(t('noLogs'))}</p>`}</div></div></section>`;
}

function dialogFrame(title, subtitle, content) {
  return `<div class="dialog-head"><div><h2 id="dialog-title">${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="${esc(t('close'))}">${icon('close')}</button></div><div class="dialog-body">${content}</div>`;
}

function openServerForm(id = '') {
  const item = overview.servers.find(server => server.id === id);
  const title = item ? t('serverFormTitleEdit') : t('serverFormTitleNew');
  const keyUsages = ['digitalSignature', 'keyEncipherment', 'keyAgreement', 'dataEncipherment', 'nonRepudiation'];
  const selectedUsage = item?.keyUsage ?? ['digitalSignature', 'keyEncipherment'];
  const content = `<form id="server-form" data-id="${esc(item?.id ?? '')}" class="form-grid"><div class="field"><label for="server-name">${esc(t('serverName'))}</label><input class="input" id="server-name" name="name" required maxlength="100" value="${esc(item?.name ?? '')}"></div><div class="field"><label for="server-type">${esc(t('serverType'))}</label><select class="select" id="server-type" name="serverType"><option value="IIS" ${item?.serverType !== 'Tomcat' ? 'selected' : ''}>IIS</option><option value="Tomcat" ${item?.serverType === 'Tomcat' ? 'selected' : ''}>Tomcat</option></select></div><div class="field full"><label for="server-cn">${esc(t('commonName'))}</label><input class="input" id="server-cn" name="commonName" required maxlength="253" placeholder="server.example.com" value="${esc(item?.commonName ?? '')}"></div><div class="field"><label for="server-country">${esc(t('country'))}</label><input class="input" id="server-country" name="country" maxlength="2" value="${esc(item?.country ?? 'CZ')}"></div><div class="field"><label for="server-state">${esc(t('state'))}</label><input class="input" id="server-state" name="state" maxlength="100" value="${esc(item?.state ?? '')}"></div><div class="field"><label for="server-locality">${esc(t('locality'))}</label><input class="input" id="server-locality" name="locality" maxlength="100" value="${esc(item?.locality ?? '')}"></div><div class="field"><label for="server-org">${esc(t('organization'))}</label><input class="input" id="server-org" name="organization" maxlength="150" value="${esc(item?.organization ?? '')}"></div><div class="field"><label for="server-ou">${esc(t('organizationalUnit'))}</label><input class="input" id="server-ou" name="organizationalUnit" maxlength="150" value="${esc(item?.organizationalUnit ?? '')}"></div><div class="field full"><label for="server-dns">${esc(t('dnsNames'))}</label><textarea class="textarea" id="server-dns" name="dnsNames" placeholder="portal.example.com&#10;api.example.com">${esc((item?.dnsNames ?? []).join('\n'))}</textarea><span class="hint">${esc(t('altHint'))}</span></div><div class="field full"><label for="server-ips">${esc(t('ipAddresses'))}</label><textarea class="textarea" id="server-ips" name="ipAddresses" placeholder="10.0.0.25&#10;2001:db8::25">${esc((item?.ipAddresses ?? []).join('\n'))}</textarea></div><div class="field full"><span class="field-label">${esc(t('keyUsage'))}</span><div class="form-grid">${keyUsages.map(value => `<label class="checkbox-row"><input type="checkbox" name="keyUsage" value="${value}" ${selectedUsage.includes(value) ? 'checked' : ''}><span>${esc(t(value))}</span></label>`).join('')}</div></div><div class="field"><label for="server-algorithm">${esc(t('keyAlgorithm'))}</label><select class="select" id="server-algorithm" name="keyAlgorithm"><option value="RSA" ${item?.keyAlgorithm !== 'ECDSA' ? 'selected' : ''}>${esc(t('rsa'))}</option><option value="ECDSA" ${item?.keyAlgorithm === 'ECDSA' ? 'selected' : ''}>${esc(t('ecdsa'))}</option></select></div><div class="field"><label for="server-validity">${esc(t('validDays'))}</label><input class="input" id="server-validity" name="validDays" type="number" min="1" max="825" value="${esc(item?.validDays ?? 397)}"></div><div class="field full"><label for="server-description">${esc(t('description'))}</label><textarea class="textarea" id="server-description" name="description">${esc(item?.description ?? '')}</textarea></div><div class="field full form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${esc(t('saveServer'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(title, t('serverIssueSubtitle'), content);
  dialog.showModal();
}

function openIssueDialog(id) {
  const server = overview.servers.find(item => item.id === id);
  if (!server) return;
  const names = [...new Set([...server.dnsNames, ...server.ipAddresses])].join(', ') || '—';
  const content = `<form id="issue-form" data-id="${esc(id)}" class="form-grid"><div class="field full"><div class="callout">${icon('info')}<span>${esc(t('reviewRenewal'))}</span></div></div><div class="field full"><div class="meta-grid"><div class="meta-item"><div class="meta-label">${esc(t('serverName'))}</div><div class="meta-value">${esc(server.name)}</div></div><div class="meta-item"><div class="meta-label">${esc(t('commonName'))}</div><div class="meta-value">${esc(server.commonName)}</div></div><div class="meta-item"><div class="meta-label">${esc(t('dnsNames'))} / ${esc(t('ipAddresses'))}</div><div class="meta-value" style="white-space:normal">${esc(names)}</div></div><div class="meta-item"><div class="meta-label">${esc(t('keyUsage'))}</div><div class="meta-value">${server.keyUsage.map(value => esc(t(value))).join(', ')}</div></div><div class="meta-item"><div class="meta-label">${esc(t('keyAlgorithm'))}</div><div class="meta-value">${esc(server.keyAlgorithm)} · ${esc(server.validDays)} ${esc(language === 'cs' ? 'dnů' : 'days')}</div></div><div class="meta-item"><div class="meta-label">${esc(t('serverType'))}</div><div class="meta-value">${esc(server.serverType)}</div></div></div></div><div class="field full"><label>${esc(t('certificatePassword'))}</label>${passwordInput('password', 'issue-password', 'new-password')}</div><div class="field full"><label>${esc(t('reenterPassword'))}</label>${passwordInput('confirmPassword', 'issue-confirm', 'new-password')}</div><div class="field full"><span class="hint">${esc(t('pfxHint'))}</span></div><div class="field full"><label class="checkbox-row"><input type="checkbox" name="reviewConfirmed" required><span>${esc(t('reviewConfirmed'))}</span></label></div><div class="field full form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${icon('certificate')}${esc(t('issue'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(t('serverIssueTitle'), `${server.name} · ${server.serverType}`, content);
  dialog.showModal();
}

function openExportDialog(target, id, format = '') {
  const needsPassword = ['pfx', 'p12', 'key'].includes(format);
  const title = target === 'ca' ? t('caTitle') : overview.servers.find(server => server.id === id)?.name ?? t('exportTitle');
  if (format && !needsPassword) {
    downloadFile(target, id, format).catch(showError);
    return;
  }
  const formats = target === 'ca' ? ['pem', 'der', 'crt', 'p7b', 'p12', 'key'] : ['pem', 'der', 'crt', 'p7b', 'pfx', 'p12', 'key'];
  const labels = { pem: 'formatPem', der: 'formatDer', crt: 'formatCrt', p7b: 'formatP7b', p12: 'formatP12', pfx: 'formatPfx', key: 'formatKey' };
  const content = `<form id="export-form" data-target="${target}" data-id="${esc(id)}" class="form-grid one"><div class="field"><label for="export-format">${esc(t('exportTitle'))}</label><select class="select" id="export-format" name="format">${formats.map(item => `<option value="${item}" ${item === (format || (target === 'ca' ? 'p12' : 'pfx')) ? 'selected' : ''}>${esc(t(labels[item]))}</option>`).join('')}</select></div><div id="export-password-field" class="field ${needsPassword ? '' : 'hidden'}"><label for="export-password">${esc(t('exportPassword'))}</label>${passwordInput('password', 'export-password', 'new-password')}</div><div class="callout warning">${icon('lock')}<span>${esc(t('exportKeyWarning'))}</span></div><div class="field form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${icon('download')}${esc(t('downloadFile'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(t('exportTitle'), title, content);
  dialog.showModal();
}

function openGenerateCaDialog() {
  const hasCa = Boolean(overview.authority);
  const content = `<form id="generate-ca-form" class="form-grid"><div class="field full"><div class="callout">${icon('info')}<span>${esc(t('caGenerateForm'))}. ${esc(t('importInfo'))}</span></div></div>${hasCa ? `<div class="field full"><div class="callout danger">${icon('warning')}<span>${esc(t('renewWarning'))}</span></div></div><div class="field full"><label class="checkbox-row"><input type="checkbox" name="confirmReplacement" required><span>${esc(t('confirmReplacement'))}</span></label></div>` : ''}<div class="field full"><label for="ca-cn">${esc(t('commonName'))}</label><input class="input" id="ca-cn" name="commonName" required maxlength="64" value="${esc(overview.authority?.subject.match(/CN=([^,]+)/i)?.[1] ?? 'INFOMATIC CA')}"></div><div class="field"><label for="ca-country">${esc(t('country'))}</label><input class="input" id="ca-country" name="country" maxlength="2" value="CZ"></div><div class="field"><label for="ca-state">${esc(t('state'))}</label><input class="input" id="ca-state" name="state" maxlength="100" value=""></div><div class="field"><label for="ca-locality">${esc(t('locality'))}</label><input class="input" id="ca-locality" name="locality" maxlength="100" value="Praha"></div><div class="field"><label for="ca-org">${esc(t('organization'))}</label><input class="input" id="ca-org" name="organization" maxlength="150" value="INFOMATIC s.r.o."></div><div class="field"><label for="ca-ou">${esc(t('organizationalUnit'))}</label><input class="input" id="ca-ou" name="organizationalUnit" maxlength="150" value="Security"></div><div class="field"><label for="ca-algorithm">${esc(t('keyAlgorithm'))}</label><select class="select" id="ca-algorithm" name="keyAlgorithm"><option value="RSA">RSA</option><option value="ECDSA">ECDSA</option></select></div><div class="field" id="ca-rsa-bits-field"><label for="ca-rsa-bits">${esc(t('rsaBits'))}</label><select class="select" id="ca-rsa-bits" name="rsaBits"><option value="3072">3072 bit</option><option value="2048">2048 bit</option><option value="4096">4096 bit</option></select></div><div class="field"><label for="ca-days">${esc(t('caValidity'))}</label><input class="input" id="ca-days" name="validDays" type="number" min="365" max="3650" value="3650"></div><div class="field"><label>${esc(t('caKeyPassword'))}</label>${passwordInput('password', 'ca-password', 'new-password')}</div><div class="field"><label>${esc(t('reenterPassword'))}</label>${passwordInput('confirmPassword', 'ca-confirm', 'new-password')}</div><div class="field full"><span class="hint">${esc(t('exportKeyWarning'))}</span></div><div class="field full form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${icon('shieldCheck')}${esc(t('generateAuthority'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(t('generateAuthority'), t('caSubtitle'), content);
  dialog.showModal();
}

function openImportCaDialog() {
  const hasCa = Boolean(overview.authority);
  const content = `<form id="import-ca-form" class="form-grid"><div class="field full"><label for="ca-import-mode">${esc(t('importing'))}</label><select class="select" id="ca-import-mode" name="mode"><option value="pfx">${esc(t('importModePfx'))}</option><option value="pair">${esc(t('importModePair'))}</option></select></div><div class="field full import-pfx-field"><label for="ca-pfx-file">${esc(t('importPfx'))}</label><input class="input" id="ca-pfx-file" name="pfxFile" type="file" accept=".pfx,.p12,application/x-pkcs12"></div><div class="field full import-pair-field hidden"><label for="ca-cert-file">${esc(t('importCertificate'))}</label><input class="input" id="ca-cert-file" name="certificateFile" type="file" accept=".pem,.crt,.cer,.der,.crt,text/plain,application/pkix-cert"></div><div class="field full import-pair-field hidden"><label for="ca-key-file">${esc(t('importKey'))}</label><input class="input" id="ca-key-file" name="keyFile" type="file" accept=".pem,.key,text/plain"></div><div class="field full"><label for="ca-import-password">${esc(t('importKeyPassword'))}</label><input class="input" id="ca-import-password" name="password" type="password" autocomplete="off"><span class="hint">${esc(t('importInfo'))}</span></div>${hasCa ? `<div class="field full"><div class="callout warning">${icon('warning')}<span>${esc(t('importReplacementWarning'))}</span></div><label class="checkbox-row" style="margin-top:11px"><input type="checkbox" name="confirmReplacement" required><span>${esc(t('confirmReplacement'))}</span></label></div>` : ''}<div class="field full form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${icon('download')}${esc(t('importAuthorityAction'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(t('importExisting'), t('importInfo'), content);
  dialog.showModal();
  updateImportMode();
}

function openUserForm(id = '') {
  const user = users.find(item => item.id === id);
  const content = `<form id="user-form" data-id="${esc(user?.id ?? '')}" class="form-grid"><div class="field"><label for="user-username">${esc(t('username'))}</label><input class="input" id="user-username" name="username" required minlength="3" maxlength="64" pattern="[A-Za-z0-9._-]+" autocomplete="off" ${user ? 'readonly' : ''} value="${esc(user?.username ?? '')}"></div><div class="field"><label for="user-fullname">${esc(t('fullName'))}</label><input class="input" id="user-fullname" name="fullName" required maxlength="120" value="${esc(user?.fullName ?? '')}"></div><div class="field"><label for="user-email">${esc(t('email'))}</label><input class="input" id="user-email" name="email" type="email" required maxlength="254" value="${esc(user?.email ?? '')}"></div><div class="field"><label for="user-language">${esc(t('language'))}</label><select class="select" id="user-language" name="language"><option value="cs" ${user?.language !== 'en' ? 'selected' : ''}>Čeština</option><option value="en" ${user?.language === 'en' ? 'selected' : ''}>English</option></select></div><div class="field"><label for="user-role">${esc(t('role'))}</label><select class="select" id="user-role" name="role"><option value="user" ${user?.role !== 'admin' ? 'selected' : ''}>${esc(t('userRole'))}</option><option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>${esc(t('adminRole'))}</option></select></div>${user ? `<div class="field"><label for="user-status">${esc(t('accountStatus'))}</label><select class="select" id="user-status" name="status"><option value="active" ${user.status === 'active' ? 'selected' : ''}>${esc(t('active'))}</option><option value="disabled" ${user.status !== 'active' ? 'selected' : ''}>${esc(t('disabled'))}</option></select></div>` : `<div class="field"><label>${esc(t('password'))}</label>${passwordInput('password', 'user-password', 'new-password')}</div>`}${user ? `<div class="field full"><label for="user-password">${esc(t('newPassword'))}</label><input class="input" id="user-password" name="password" type="password" autocomplete="new-password"><span class="hint">${esc(t('passwordKeepHint'))}</span></div>` : ''}<div class="field full form-actions">${user ? `<button class="btn danger" type="button" data-action="delete-user" data-id="${esc(user.id)}">${icon('trash')}${esc(t('remove'))}</button>` : ''}<button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn primary" type="submit">${esc(user ? t('saveChanges') : t('createUser'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(user ? t('userFormEdit') : t('userFormNew'), user?.username ?? '', content);
  dialog.showModal();
}

function openConfirmation(action, id, message) {
  const content = `<form id="confirm-form" data-action-to-run="${esc(action)}" data-id="${esc(id)}" class="form-grid one"><div class="callout danger">${icon('warning')}<span>${esc(message)}</span></div><div class="field form-actions"><button class="btn secondary" type="button" data-action="close-dialog">${esc(t('cancel'))}</button><button class="btn danger" type="submit">${esc(t('confirmAction'))}</button></div></form>`;
  dialog.innerHTML = dialogFrame(t('confirmationTitle'), '', content);
  dialog.showModal();
}

function showError(error) {
  const code = error instanceof Error ? error.message : 'generic';
  const message = error?.referenceId
    ? t('error_server_error_reference').replace('{id}', error.referenceId)
    : errorText(code);
  if (dialog.open) {
    let alert = dialog.querySelector('.dialog-error');
    if (!alert) {
      alert = document.createElement('div');
      alert.className = 'callout danger dialog-error';
      alert.setAttribute('role', 'alert');
      alert.setAttribute('aria-live', 'assertive');
      alert.tabIndex = -1;
      alert.innerHTML = `${icon('warning')}<span></span>`;
      dialog.querySelector('.dialog-body')?.prepend(alert);
    }
    alert.querySelector('span:last-child').textContent = message;
    alert.focus();
    alert.scrollIntoView({ block: 'nearest' });
    return;
  }
  showToast(message, 'error');
}

async function downloadFile(target, id, format, password = '') {
  const path = target === 'ca' ? '/api/ca/export' : `/api/servers/${encodeURIComponent(id)}/export`;
  const response = await request(path, { method: 'POST', body: { format, password } });
  if (!(response instanceof Response)) return;
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') ?? '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const filename = encoded ? decodeURIComponent(encoded) : plain ?? `certificate.${format}`;
  saveBlob(blob, filename);
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function setLanguage(nextLanguage) {
  if (!['cs', 'en'].includes(nextLanguage)) return;
  language = nextLanguage;
  localStorage.setItem('caweb-language', language);
  setupDraft.language = language;
  if (screen === 'app' && overview?.user) {
    try {
      await request('/api/me/language', { method: 'PUT', body: { language } });
      if (overview) overview.user.language = language;
      if (state?.user) state.user.language = language;
    } catch (error) { showError(error); return; }
  }
  render();
}

function updateImportMode() {
  const mode = document.getElementById('ca-import-mode')?.value ?? pendingFilesMode;
  pendingFilesMode = mode;
  document.querySelectorAll('.import-pfx-field').forEach(node => node.classList.toggle('hidden', mode !== 'pfx'));
  document.querySelectorAll('.import-pair-field').forEach(node => node.classList.toggle('hidden', mode === 'pfx'));
  const pfx = document.getElementById('ca-pfx-file');
  const certificate = document.getElementById('ca-cert-file');
  const key = document.getElementById('ca-key-file');
  if (pfx) pfx.required = mode === 'pfx';
  if (certificate) certificate.required = mode !== 'pfx';
  if (key) key.required = mode !== 'pfx';
}

function updateExportPasswordVisibility() {
  const format = document.getElementById('export-format')?.value;
  const node = document.getElementById('export-password-field');
  if (!node) return;
  const required = ['pfx', 'p12', 'key'].includes(format);
  node.classList.toggle('hidden', !required);
  const field = node.querySelector('input');
  if (field) field.required = required;
}

function refreshServerRows() {
  const body = document.querySelector('.data-table tbody');
  if (!body) return;
  const servers = filteredServers();
  body.innerHTML = servers.length ? servers.map(serverRow).join('') : `<tr><td colspan="6" style="padding:28px;text-align:center;color:var(--muted)">${esc(t('noMatch'))}</td></tr>`;
}

async function handleClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id ?? '';
  try {
    if (action === 'language') { await setLanguage(button.dataset.language); return; }
    if (action === 'tab') {
      currentTab = button.dataset.tab ?? 'overview';
      document.getElementById('sidebar')?.classList.remove('open');
      if (currentTab === 'users') users = await request('/api/users');
      if (currentTab === 'settings') {
        [settings, applicationLogs] = await Promise.all([request('/api/settings'), request('/api/logs')]);
      }
      render(); return;
    }
    if (action === 'refresh-logs') { applicationLogs = await request('/api/logs'); render(); return; }
    if (action === 'menu') { document.getElementById('sidebar')?.classList.toggle('open'); return; }
    if (action === 'toggle-password') {
      const input = document.getElementById(button.dataset.target);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        button.innerHTML = icon(input.type === 'password' ? 'eye' : 'eyeOff');
        button.setAttribute('aria-label', t(input.type === 'password' ? 'passwordShow' : 'passwordHide'));
      }
      return;
    }
    if (action === 'register') { renderRegisterDialog(); return; }
    if (action === 'close-dialog') { dialog.close(); return; }
    if (action === 'setup-back') { setupStep = Math.max(1, setupStep - 1); render(); return; }
    if (action === 'retry') { screen = 'loading'; render(); await initialize(); return; }
    if (action === 'logout') {
      await request('/api/logout', { method: 'POST' });
      state = await fetchStatus(); overview = null; screen = 'login'; currentTab = 'overview'; render(); return;
    }
    if (action === 'new-server') { openServerForm(); return; }
    if (action === 'edit-server') { openServerForm(id); return; }
    if (action === 'duplicate-server') {
      await request(`/api/servers/${encodeURIComponent(id)}/duplicate`, { method: 'POST', body: {} });
      await refresh(); showToast(t('serverCreated')); return;
    }
    if (action === 'issue-server') { openIssueDialog(id); return; }
    if (action === 'export-server') { openExportDialog('server', id); return; }
    if (action === 'download-server') { openExportDialog('server', id, button.dataset.format); return; }
    if (action === 'download-ca') { openExportDialog('ca', '', button.dataset.format); return; }
    if (action === 'delete-server') { openConfirmation('delete-server', id, t('confirmDeleteServer')); return; }
    if (action === 'generate-ca') { openGenerateCaDialog(); return; }
    if (action === 'import-ca') { openImportCaDialog(); return; }
    if (action === 'new-user') { openUserForm(); return; }
    if (action === 'edit-user') { openUserForm(id); return; }
    if (action === 'approve-user') {
      await request(`/api/users/${encodeURIComponent(id)}/decision`, { method: 'POST', body: { decision: 'approve' } });
      users = await request('/api/users'); await refreshOverview(); render(); showToast(t('userApproved')); return;
    }
    if (action === 'reject-user') { openConfirmation('reject-user', id, t('confirmRejectUser')); return; }
    if (action === 'delete-user') { openConfirmation('delete-user', id, t('confirmDeleteUser')); return; }
  } catch (error) { showError(error); }
}

function formValues(form) {
  const values = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (Object.hasOwn(values, key)) values[key] = Array.isArray(values[key]) ? [...values[key], value] : [values[key], value];
    else values[key] = value;
  }
  return values;
}

function csvLines(value) {
  return String(value ?? '').split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  try {
    if (form.id === 'login-form') {
      const values = formValues(form);
      await request('/api/login', { method: 'POST', body: values });
      state = await fetchStatus();
      language = state.user?.language ?? language;
      screen = 'app'; currentTab = 'overview'; await refresh(); return;
    }
    if (form.id === 'setup-admin-form') {
      const values = formValues(form);
      setupDraft = { ...setupDraft, ...values };
      language = values.language;
      localStorage.setItem('caweb-language', language);
      setupStep = 2; render(); return;
    }
    if (form.id === 'setup-smtp-form') {
      const values = formValues(form);
      setupDraft = { ...setupDraft, ...values, smtpUseTls: form.elements.namedItem('smtpUseTls').checked };
      setupStep = 3; render(); return;
    }
    if (form.id === 'setup-finish-form') {
      const input = { ...setupDraft, smtpPort: Number(setupDraft.smtpPort || 587) };
      await request('/api/setup', { method: 'POST', body: input });
      state = await fetchStatus(); language = state.user?.language ?? language; screen = 'app'; currentTab = 'overview';
      try { await refresh(); } catch (error) { showError(error); }
      showToast(t('completionTitle')); return;
    }
    if (form.id === 'register-form') {
      const values = formValues(form);
      await request('/api/register', { method: 'POST', body: values });
      dialog.close(); state = await fetchStatus(); renderLogin(); showToast(t('registrationSent')); return;
    }
    if (form.id === 'server-form') {
      const values = formValues(form);
      const input = { ...values, dnsNames: csvLines(values.dnsNames), ipAddresses: csvLines(values.ipAddresses), keyUsage: [...form.querySelectorAll('input[name="keyUsage"]:checked')].map(item => item.value), validDays: Number(values.validDays) };
      const id = form.dataset.id;
      await request(id ? `/api/servers/${encodeURIComponent(id)}` : '/api/servers', { method: id ? 'PUT' : 'POST', body: input });
      dialog.close(); await refresh(); showToast(t(id ? 'serverUpdated' : 'serverCreated')); return;
    }
    if (form.id === 'issue-form') {
      const values = formValues(form);
      const response = await request(`/api/servers/${encodeURIComponent(form.dataset.id)}/issue`, { method: 'POST', body: { password: values.password, confirmPassword: values.confirmPassword, reviewConfirmed: form.elements.namedItem('reviewConfirmed').checked } });
      const blob = await response.blob();
      const fileName = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/i)?.[1] ?? 'certificate.pfx';
      saveBlob(blob, fileName); dialog.close(); await refresh(); showToast(t('certificateIssued')); return;
    }
    if (form.id === 'export-form') {
      const values = formValues(form);
      await downloadFile(form.dataset.target, form.dataset.id, values.format, values.password ?? '');
      dialog.close(); return;
    }
    if (form.id === 'generate-ca-form') {
      const values = formValues(form);
      const password = values.password;
      const payload = { ...values, rsaBits: Number(values.rsaBits), validDays: Number(values.validDays), confirmReplacement: form.elements.namedItem('confirmReplacement')?.checked ?? false };
      await request('/api/ca/generate', { method: 'POST', body: payload });
      dialog.close();
      try { await downloadFile('ca', '', 'p12', password); showToast(t('caExportReady')); } catch (error) { showError(error); }
      currentTab = 'authority'; await refresh(); showToast(t('caCreated')); return;
    }
    if (form.id === 'import-ca-form') {
      const data = new FormData(form);
      data.set('mode', form.elements.namedItem('mode').value);
      data.set('confirmReplacement', String(form.elements.namedItem('confirmReplacement')?.checked ?? false));
      const previous = overview.authority;
      const result = await request('/api/ca/import', { method: 'POST', body: data });
      dialog.close(); currentTab = 'authority'; await refresh();
      const imported = result.authority;
      const messageKey = !previous ? 'caImportedSuccess'
        : previous.thumbprint === imported.thumbprint ? 'caImportedSame'
          : previous.publicKeyFingerprint === imported.publicKeyFingerprint ? 'caImportedSameKey' : 'caImportedNewKey';
      showToast(t(messageKey)); return;
    }
    if (form.id === 'user-form') {
      const values = formValues(form);
      const id = form.dataset.id;
      if (id) {
        await request(`/api/users/${encodeURIComponent(id)}`, { method: 'PUT', body: { fullName: values.fullName, email: values.email, language: values.language, role: values.role, status: values.status, password: values.password || null } });
      } else {
        await request('/api/users', { method: 'POST', body: values });
      }
      dialog.close(); users = await request('/api/users'); await refreshOverview(); render(); showToast(t(id ? 'userSaved' : 'userCreated')); return;
    }
    if (form.id === 'settings-form') {
      const values = formValues(form);
      const payload = { ...values, port: Number(values.port || 587), password: values.password || null, useTls: form.elements.namedItem('useTls').checked, registrationEnabled: form.elements.namedItem('registrationEnabled').checked };
      await request('/api/settings', { method: 'PUT', body: payload });
      settings = await request('/api/settings'); await refreshOverview(); render(); showToast(t('smtpSaved')); return;
    }
    if (form.id === 'test-email-form') {
      const values = formValues(form);
      await request('/api/settings/test-email', { method: 'POST', body: values });
      showToast(t('testEmailSent')); return;
    }
    if (form.id === 'confirm-form') {
      const id = form.dataset.id;
      const action = form.dataset.actionToRun;
      if (action === 'delete-server') await request(`/api/servers/${encodeURIComponent(id)}/delete`, { method: 'POST', body: { confirmed: true } });
      if (action === 'reject-user') await request(`/api/users/${encodeURIComponent(id)}/decision`, { method: 'POST', body: { decision: 'reject' } });
      if (action === 'delete-user') await request(`/api/users/${encodeURIComponent(id)}/delete`, { method: 'POST', body: { confirmed: true } });
      dialog.close();
      if (action === 'delete-server') { await refresh(); showToast(t('serverDeleted')); }
      else { users = await request('/api/users'); await refreshOverview(); render(); showToast(action === 'reject-user' ? t('userRejected') : t('userSaved')); }
    }
  } catch (error) { showError(error); }
}

function handleChange(event) {
  if (event.target.id === 'ca-import-mode') updateImportMode();
  if (event.target.id === 'export-format') updateExportPasswordVisibility();
  if (event.target.id === 'ca-algorithm') document.getElementById('ca-rsa-bits-field')?.classList.toggle('hidden', event.target.value !== 'RSA');
  if (event.target.id === 'server-status-filter') { serverStatusFilter = event.target.value; refreshServerRows(); }
}

function handleInput(event) {
  if (event.target.id === 'server-search') {
    serverQuery = event.target.value;
    refreshServerRows();
  }
}

appRoot.addEventListener('click', handleClick);
appRoot.addEventListener('submit', handleSubmit);
appRoot.addEventListener('change', handleChange);
appRoot.addEventListener('input', handleInput);
dialog.addEventListener('click', handleClick);
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('submit', handleSubmit);
dialog.addEventListener('change', handleChange);
initialize();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const appBase = document.querySelector('base')?.href ?? `${location.origin}/`;
  const serviceWorkerUrl = new URL('service-worker.js', appBase);
  const serviceWorkerScope = new URL('./', appBase).pathname;
  navigator.serviceWorker.register(serviceWorkerUrl, { scope: serviceWorkerScope }).catch(() => {});
}

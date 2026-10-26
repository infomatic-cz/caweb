using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.DataProtection;

namespace CAWeb;

public sealed record CertificateMaterial(byte[] CertificateDer, byte[] ProtectedPrivateKey, string KeyAlgorithm, string Subject, string Thumbprint, DateTimeOffset NotBefore, DateTimeOffset NotAfter, bool Imported);
public sealed record CertificateDownload(byte[] Content, string FileName, string ContentType);
public sealed record IssuedCertificate(byte[] CertificateDer, byte[] ProtectedPrivateKey, string Subject, string IssuerThumbprint, DateTimeOffset IssuedAt, DateTimeOffset ExpiresAt, string ParameterSnapshot, CertificateDownload PfxDownload);

public static class CertificateService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly PbeParameters KeyEncryption = new(PbeEncryptionAlgorithm.Aes256Cbc, HashAlgorithmName.SHA256, 210_000);

    public static CertificateMaterial GenerateAuthority(CaGenerateRequest input, IDataProtector protector)
    {
        ValidatePassphrase(input.Password, input.ConfirmPassword);
        if (input.ValidDays is < 365 or > 3650) throw new AppValidationException("invalid_ca_validity");

        var name = BuildDistinguishedName(input.CommonName, input.Country, input.State, input.Locality, input.Organization, input.OrganizationalUnit);
        var algorithm = input.KeyAlgorithm.Equals("ECDSA", StringComparison.OrdinalIgnoreCase) ? "ECDSA" : "RSA";
        using var privateKey = CreateKey(algorithm, input.RsaBits);
        var request = CreateRequest(name, privateKey);
        request.CertificateExtensions.Add(new X509BasicConstraintsExtension(true, true, 0, true));
        request.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyCertSign | X509KeyUsageFlags.CrlSign, true));
        request.CertificateExtensions.Add(new X509SubjectKeyIdentifierExtension(request.PublicKey, false));

        var now = DateTimeOffset.UtcNow;
        using var certificate = request.CreateSelfSigned(now.AddMinutes(-5), now.AddDays(input.ValidDays));
        return ToMaterial(certificate, privateKey, algorithm, imported: false, protector);
    }

    public static CertificateMaterial ImportAuthority(string mode, byte[]? pfx, byte[]? certificateFile, byte[]? keyFile, string? password, IDataProtector protector)
    {
        X509Certificate2? certificate = null;
        try
        {
            if (mode.Equals("pfx", StringComparison.OrdinalIgnoreCase))
            {
                if (pfx is not { Length: > 0 }) throw new AppValidationException("missing_pfx");
                var collection = new X509Certificate2Collection();
#pragma warning disable SYSLIB0057
                collection.Import(pfx, password, X509KeyStorageFlags.EphemeralKeySet | X509KeyStorageFlags.Exportable);
#pragma warning restore SYSLIB0057
                certificate = collection.Cast<X509Certificate2>().FirstOrDefault(item => item.HasPrivateKey && IsCertificateAuthority(item));
                foreach (var item in collection)
                {
                    if (!ReferenceEquals(item, certificate)) item.Dispose();
                }
                if (certificate is null) throw new AppValidationException("ca_pfx_missing_private_key");
                using var rsaKey = certificate.GetRSAPrivateKey();
                if (rsaKey is not null)
                {
                    return ToMaterial(certificate, rsaKey, "RSA", imported: true, protector);
                }
                using var ecdsa = certificate.GetECDsaPrivateKey();
                if (ecdsa is not null)
                {
                    return ToMaterial(certificate, ecdsa, "ECDSA", imported: true, protector);
                }
                throw new AppValidationException("unsupported_ca_key");
            }

            if (certificateFile is not { Length: > 0 } || keyFile is not { Length: > 0 })
                throw new AppValidationException("missing_ca_pair");

            var certificateText = Encoding.UTF8.GetString(certificateFile);
            certificate = certificateText.Contains("-----BEGIN CERTIFICATE-----", StringComparison.Ordinal)
                ? X509Certificate2.CreateFromPem(certificateText)
                : new X509Certificate2(certificateFile);

            var keyText = Encoding.UTF8.GetString(keyFile);
            using var key = LoadPrivateKey(keyText, password);
            var algorithm = key is RSA ? "RSA" : "ECDSA";
            var withPrivateKey = key is RSA rsa
                ? certificate.CopyWithPrivateKey(rsa)
                : certificate.CopyWithPrivateKey((ECDsa)key);
            certificate.Dispose();
            certificate = withPrivateKey;
            return ToMaterial(certificate, key, algorithm, imported: true, protector);
        }
        catch (AppValidationException)
        {
            throw;
        }
        catch (Exception exception) when (exception is CryptographicException or ArgumentException or InvalidOperationException or FormatException)
        {
            throw new AppValidationException("ca_import_failed", exception);
        }
        finally
        {
            certificate?.Dispose();
        }
    }

    public static IssuedCertificate IssueServer(CertificateAuthorityRecord authority, ServerRecord server, IssueRequest input, IDataProtector protector)
    {
        if (!input.ReviewConfirmed) throw new AppValidationException("review_required");
        ValidatePassphrase(input.Password, input.ConfirmPassword);
        ValidateServer(server);

        using var issuer = AttachPrivateKey(authority.CertificateDer, protector.Unprotect(authority.ProtectedPrivateKey), authority.KeyAlgorithm);
        using var issuerPublic = new X509Certificate2(authority.CertificateDer);
        using var leafKey = CreateKey(server.KeyAlgorithm, server.KeyAlgorithm == "RSA" ? 3072 : 0);
        var request = CreateRequest(BuildDistinguishedName(server.CommonName, server.Country, server.State, server.Locality, server.Organization, server.OrganizationalUnit), leafKey);
        request.CertificateExtensions.Add(new X509BasicConstraintsExtension(false, false, 0, true));
        var usage = ToKeyUsage(server.KeyUsage);
        request.CertificateExtensions.Add(new X509KeyUsageExtension(usage, true));
        request.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(new OidCollection { new("1.3.6.1.5.5.7.3.1") }, false));
        request.CertificateExtensions.Add(BuildSubjectAlternativeName(server));
        request.CertificateExtensions.Add(new X509SubjectKeyIdentifierExtension(request.PublicKey, false));

        var now = DateTimeOffset.UtcNow;
        var notBefore = now.AddMinutes(-5);
        var notAfter = now.AddDays(server.ValidDays);
        var serial = RandomNumberGenerator.GetBytes(16);
        serial[0] &= 0x7f;
        if (serial.All(value => value == 0)) serial[^1] = 1;
        using var issuerRsa = issuer.GetRSAPrivateKey();
        using var issuerEcdsa = issuer.GetECDsaPrivateKey();
        var signatureGenerator = issuerRsa is not null
            ? X509SignatureGenerator.CreateForRSA(issuerRsa, RSASignaturePadding.Pkcs1)
            : issuerEcdsa is not null
                ? X509SignatureGenerator.CreateForECDsa(issuerEcdsa)
                : throw new AppValidationException("unsupported_ca_key");
        using var publicCertificate = request.Create(issuer.SubjectName, signatureGenerator, notBefore, notAfter, serial);
        using var privateCertificate = leafKey is RSA rsa
            ? publicCertificate.CopyWithPrivateKey(rsa)
            : publicCertificate.CopyWithPrivateKey((ECDsa)leafKey);

        var pkcs8 = ExportPkcs8(leafKey);
        var protectedKey = protector.Protect(pkcs8);
        CryptographicOperations.ZeroMemory(pkcs8);

        var pfx = BuildPfx(privateCertificate, issuerPublic, input.Password);
        var extension = server.ServerType.Equals("Tomcat", StringComparison.OrdinalIgnoreCase) ? "p12" : "pfx";
        var baseName = SafeFileName(server.Name);
        var download = new CertificateDownload(pfx, $"{baseName}.{extension}", "application/x-pkcs12");
        return new IssuedCertificate(privateCertificate.RawData, protectedKey, privateCertificate.Subject, authority.Thumbprint, now, notAfter,
            Snapshot(server), download);
    }

    public static CertificateDownload ExportAuthority(CertificateAuthorityRecord authority, string format, string? password, IDataProtector protector)
    {
        using var certificate = AttachPrivateKey(authority.CertificateDer, protector.Unprotect(authority.ProtectedPrivateKey), authority.KeyAlgorithm);
        return Export(certificate, null, SafeFileNameForSubject(authority.Subject), format, password);
    }

    public static CertificateDownload ExportServer(CertificateAuthorityRecord? authority, ServerRecord server, string format, string? password, IDataProtector protector)
    {
        if (server.CertificateDer is null || server.ProtectedPrivateKey is null) throw new AppValidationException("certificate_not_issued");
        using var certificate = AttachPrivateKey(server.CertificateDer, protector.Unprotect(server.ProtectedPrivateKey), server.KeyAlgorithm);
        X509Certificate2? issuer = null;
        if (authority is not null && server.IssuerThumbprint == authority.Thumbprint)
            issuer = new X509Certificate2(authority.CertificateDer);
        try { return Export(certificate, issuer, SafeFileName(server.Name), format, password); }
        finally { issuer?.Dispose(); }
    }

    public static ServerSummary Summarize(ServerRecord server, CertificateAuthorityRecord? authority)
    {
        var snapshot = Snapshot(server);
        var changed = server.CertificateDer is not null && !string.Equals(snapshot, server.IssuedParametersJson, StringComparison.Ordinal);
        var status = "not-issued";
        var detail = "certificate_missing";
        if (server.CertificateDer is not null)
        {
            if (server.ExpiresAt < DateTimeOffset.UtcNow) (status, detail) = ("expired", "certificate_expired");
            else if (authority is null || !string.Equals(server.IssuerThumbprint, authority.Thumbprint, StringComparison.OrdinalIgnoreCase)) (status, detail) = ("ca-changed", "issuer_changed");
            else if (changed) (status, detail) = ("review", "parameters_changed");
            else if (server.ExpiresAt <= DateTimeOffset.UtcNow.AddDays(30)) (status, detail) = ("expiring", "certificate_expiring");
            else (status, detail) = ("active", "certificate_active");
        }
        return new ServerSummary(server.Id, server.Name, server.Description, server.ServerType, server.CommonName, server.DnsNames, server.IpAddresses,
            server.KeyUsage, server.KeyAlgorithm, server.ValidDays, status, detail, server.IssuedSubject, server.IssuerThumbprint,
            server.IssuedAt, server.ExpiresAt, changed, server.Country, server.State, server.Locality, server.Organization, server.OrganizationalUnit);
    }

    public static string Snapshot(ServerRecord server) => JsonSerializer.Serialize(new
    {
        server.Name, server.Description, server.ServerType, server.CommonName, server.Country, server.State, server.Locality,
        server.Organization, server.OrganizationalUnit, server.DnsNames, server.IpAddresses, server.KeyUsage, server.KeyAlgorithm, server.ValidDays
    }, JsonOptions);

    public static void ValidateServer(ServerRecord server)
    {
        if (string.IsNullOrWhiteSpace(server.Name) || server.Name.Length > 100) throw new AppValidationException("invalid_server_name");
        if (server.ServerType is not ("IIS" or "Tomcat")) throw new AppValidationException("invalid_server_type");
        if (server.KeyAlgorithm is not ("RSA" or "ECDSA")) throw new AppValidationException("invalid_key_algorithm");
        if (server.ValidDays is < 1 or > 825) throw new AppValidationException("invalid_certificate_validity");
        if (server.DnsNames.Length + server.IpAddresses.Length > 100) throw new AppValidationException("too_many_san_entries");
        if (server.KeyUsage.Length == 0) throw new AppValidationException("missing_key_usage");
        if (!server.KeyUsage.All(item => item is "digitalSignature" or "keyEncipherment" or "keyAgreement" or "dataEncipherment" or "nonRepudiation"))
            throw new AppValidationException("invalid_key_usage");
        if (server.CommonName.Length > 64 || server.CommonName.Any(char.IsControl)) throw new AppValidationException("invalid_common_name");
        foreach (var dns in server.DnsNames.Where(item => item.Length > 0)) NormalizeDnsName(dns);
        if (server.CommonName.Length > 0 && !IPAddress.TryParse(server.CommonName, out _)) NormalizeDnsName(server.CommonName);
        foreach (var ip in server.IpAddresses) if (!IPAddress.TryParse(ip, out _)) throw new AppValidationException("invalid_ip_address");
        if (server.DnsNames.Length == 0 && server.IpAddresses.Length == 0) throw new AppValidationException("san_required");
    }

    public static void ValidatePassphrase(string password, string confirmPassword)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 12 || password.Length > 256)
            throw new AppValidationException("password_too_short");
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(password), Encoding.UTF8.GetBytes(confirmPassword ?? string.Empty)))
            throw new AppValidationException("password_mismatch");
    }

    public static bool IsCertificateAuthority(X509Certificate2 certificate)
    {
        var constraints = certificate.Extensions.OfType<X509BasicConstraintsExtension>().FirstOrDefault();
        return constraints?.CertificateAuthority == true;
    }

    public static string PublicKeyFingerprint(X509Certificate2 certificate)
    {
        using var rsa = certificate.GetRSAPublicKey();
        using var ecdsa = certificate.GetECDsaPublicKey();
        var publicKey = rsa?.ExportSubjectPublicKeyInfo() ?? ecdsa?.ExportSubjectPublicKeyInfo()
            ?? throw new AppValidationException("unsupported_ca_key");
        return Convert.ToHexString(SHA256.HashData(publicKey));
    }

    private static CertificateMaterial ToMaterial(X509Certificate2 certificate, AsymmetricAlgorithm key, string algorithm, bool imported, IDataProtector protector)
    {
        if (!IsCertificateAuthority(certificate)) throw new AppValidationException("certificate_not_ca");
        if (certificate.NotBefore.ToUniversalTime() > DateTime.UtcNow.AddMinutes(5)) throw new AppValidationException("ca_not_yet_valid");
        if (certificate.NotAfter.ToUniversalTime() <= DateTime.UtcNow) throw new AppValidationException("ca_expired");
        var usage = certificate.Extensions.OfType<X509KeyUsageExtension>().FirstOrDefault();
        if (usage is not null && !usage.KeyUsages.HasFlag(X509KeyUsageFlags.KeyCertSign)) throw new AppValidationException("ca_cannot_sign");
        var pkcs8 = key switch
        {
            RSA rsa => rsa.ExportPkcs8PrivateKey(),
            ECDsa ecdsa => ecdsa.ExportPkcs8PrivateKey(),
            _ => throw new AppValidationException("unsupported_ca_key")
        };
        var protectedKey = protector.Protect(pkcs8);
        CryptographicOperations.ZeroMemory(pkcs8);
        return new CertificateMaterial(certificate.RawData, protectedKey, algorithm,
            certificate.Subject, certificate.Thumbprint, certificate.NotBefore.ToUniversalTime(), certificate.NotAfter.ToUniversalTime(), imported);
    }

    private static AsymmetricAlgorithm CreateKey(string algorithm, int rsaBits)
    {
        if (algorithm.Equals("ECDSA", StringComparison.OrdinalIgnoreCase))
        {
            var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
            return key;
        }
        var bits = rsaBits is 2048 or 3072 or 4096 ? rsaBits : 3072;
        var rsa = RSA.Create(bits);
        return rsa;
    }

    private static CertificateRequest CreateRequest(X500DistinguishedName subject, AsymmetricAlgorithm key) => key switch
    {
        RSA rsa => new CertificateRequest(subject, rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1),
        ECDsa ecdsa => new CertificateRequest(subject, ecdsa, HashAlgorithmName.SHA256),
        _ => throw new AppValidationException("unsupported_key_algorithm")
    };

    private static X500DistinguishedName BuildDistinguishedName(string commonName, string country, string state, string locality, string organization, string unit)
    {
        commonName = InputValidation.Clean(commonName, 64);
        country = InputValidation.Clean(country, 2).ToUpperInvariant();
        if (commonName.Length == 0 || commonName.Any(char.IsControl)) throw new AppValidationException("invalid_common_name");
        if (country.Length > 0 && (country.Length != 2 || !country.All(character => character is >= 'A' and <= 'Z')))
            throw new AppValidationException("invalid_country");
        var values = new List<string> { $"CN={EscapeDistinguishedName(commonName)}" };
        AddDn(values, "OU", unit);
        AddDn(values, "O", organization);
        AddDn(values, "L", locality);
        AddDn(values, "S", state);
        if (country.Length > 0) AddDn(values, "C", country);
        return new X500DistinguishedName(string.Join(", ", values));
    }

    private static void AddDn(List<string> values, string key, string value)
    {
        value = InputValidation.Clean(value, 100);
        if (value.Length > 0) values.Add($"{key}={EscapeDistinguishedName(value)}");
    }

    private static string EscapeDistinguishedName(string value)
    {
        var builder = new StringBuilder(value.Length + 8);
        for (var index = 0; index < value.Length; index++)
        {
            var character = value[index];
            if (character is ',' or '+' or '"' or '\\' or '<' or '>' or ';' or '=' || ((index == 0 || index == value.Length - 1) && character == ' ')) builder.Append('\\');
            builder.Append(character);
        }
        if (builder.Length > 0 && builder[0] == '#') builder.Insert(0, '\\');
        return builder.ToString();
    }

    private static X509Extension BuildSubjectAlternativeName(ServerRecord server)
    {
        var builder = new SubjectAlternativeNameBuilder();
        var dnsNames = server.DnsNames.Where(item => !string.IsNullOrWhiteSpace(item)).Select(NormalizeDnsName).Distinct(StringComparer.OrdinalIgnoreCase);
        foreach (var dns in dnsNames) builder.AddDnsName(dns);
        var ips = server.IpAddresses.Select(IPAddress.Parse).ToList();
        if (IPAddress.TryParse(server.CommonName, out var commonNameIp)) ips.Add(commonNameIp);
        foreach (var ip in ips.Distinct()) builder.AddIpAddress(ip);
        if (dnsNames.Count() == 0 && ips.Count == 0) throw new AppValidationException("san_required");
        return builder.Build(critical: false);
    }

    private static string NormalizeDnsName(string value)
    {
        value = InputValidation.Clean(value, 253).TrimEnd('.');
        try
        {
            var wildcard = value.StartsWith("*.", StringComparison.Ordinal);
            var host = wildcard ? value[2..] : value;
            if (Uri.CheckHostName(host) != UriHostNameType.Dns) throw new AppValidationException("invalid_dns_name");
            var ascii = new IdnMapping().GetAscii(host).ToLowerInvariant();
            return wildcard ? $"*.{ascii}" : ascii;
        }
        catch (ArgumentException exception)
        {
            throw new AppValidationException("invalid_dns_name", exception);
        }
    }

    private static X509KeyUsageFlags ToKeyUsage(IEnumerable<string> usage)
    {
        var result = X509KeyUsageFlags.None;
        foreach (var item in usage)
            result |= item switch
            {
                "digitalSignature" => X509KeyUsageFlags.DigitalSignature,
                "keyEncipherment" => X509KeyUsageFlags.KeyEncipherment,
                "keyAgreement" => X509KeyUsageFlags.KeyAgreement,
                "dataEncipherment" => X509KeyUsageFlags.DataEncipherment,
                "nonRepudiation" => X509KeyUsageFlags.NonRepudiation,
                _ => X509KeyUsageFlags.None
            };
        return result;
    }

    private static AsymmetricAlgorithm LoadPrivateKey(string pem, string? password)
    {
        if (pem.Contains("ENCRYPTED PRIVATE KEY", StringComparison.Ordinal))
        {
            try
            {
                var rsa = RSA.Create();
                rsa.ImportFromEncryptedPem(pem, password ?? string.Empty);
                return rsa;
            }
            catch (CryptographicException) { }
            try
            {
                var ecdsa = ECDsa.Create();
                ecdsa.ImportFromEncryptedPem(pem, password ?? string.Empty);
                return ecdsa;
            }
            catch (CryptographicException exception)
            {
                throw new AppValidationException("ca_key_password_or_format_invalid", exception);
            }
        }

        try
        {
            var rsa = RSA.Create();
            rsa.ImportFromPem(pem);
            return rsa;
        }
        catch (CryptographicException) { }
        try
        {
            var ecdsa = ECDsa.Create();
            ecdsa.ImportFromPem(pem);
            return ecdsa;
        }
        catch (CryptographicException exception)
        {
            throw new AppValidationException("ca_key_or_format_invalid", exception);
        }
    }

    private static X509Certificate2 AttachPrivateKey(byte[] certificateDer, byte[] pkcs8, string algorithm)
    {
        using var publicCertificate = new X509Certificate2(certificateDer);
        try
        {
            if (algorithm == "RSA")
            {
                using var rsa = RSA.Create();
                rsa.ImportPkcs8PrivateKey(pkcs8, out var bytesRead);
                if (bytesRead != pkcs8.Length || !PublicKeysMatch(publicCertificate, rsa)) throw new AppValidationException("private_key_mismatch");
                return publicCertificate.CopyWithPrivateKey(rsa);
            }
            using var ecdsa = ECDsa.Create();
            ecdsa.ImportPkcs8PrivateKey(pkcs8, out var read);
            if (read != pkcs8.Length || !PublicKeysMatch(publicCertificate, ecdsa)) throw new AppValidationException("private_key_mismatch");
            return publicCertificate.CopyWithPrivateKey(ecdsa);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(pkcs8);
        }
    }

    private static bool PublicKeysMatch(X509Certificate2 certificate, RSA key)
    {
        using var publicKey = certificate.GetRSAPublicKey();
        return publicKey is not null && CryptographicOperations.FixedTimeEquals(publicKey.ExportSubjectPublicKeyInfo(), key.ExportSubjectPublicKeyInfo());
    }

    private static bool PublicKeysMatch(X509Certificate2 certificate, ECDsa key)
    {
        using var publicKey = certificate.GetECDsaPublicKey();
        return publicKey is not null && CryptographicOperations.FixedTimeEquals(publicKey.ExportSubjectPublicKeyInfo(), key.ExportSubjectPublicKeyInfo());
    }

    private static byte[] ExportPkcs8(AsymmetricAlgorithm key) => key switch
    {
        RSA rsa => rsa.ExportPkcs8PrivateKey(),
        ECDsa ecdsa => ecdsa.ExportPkcs8PrivateKey(),
        _ => throw new AppValidationException("unsupported_key_algorithm")
    };

    private static byte[] BuildPfx(X509Certificate2 certificate, X509Certificate2 issuer, string password)
    {
        var collection = new X509Certificate2Collection { certificate, issuer };
        return collection.Export(X509ContentType.Pkcs12, password) ?? throw new AppValidationException("certificate_export_failed");
    }

    private static CertificateDownload Export(X509Certificate2 certificate, X509Certificate2? issuer, string name, string format, string? password)
    {
        var kind = format.Trim().ToLowerInvariant();
        if (kind is not ("pem" or "der" or "crt" or "p7b" or "p12" or "pfx" or "key")) throw new AppValidationException("unsupported_export_format");
        if (kind is ("p12" or "pfx" or "key") && string.IsNullOrWhiteSpace(password)) throw new AppValidationException("export_password_required");
        byte[] content;
        string fileName;
        string contentType;
        switch (kind)
        {
            case "pem":
                var pem = PemEncoding.WriteString("CERTIFICATE", certificate.RawData);
                if (issuer is not null) pem += Environment.NewLine + PemEncoding.WriteString("CERTIFICATE", issuer.RawData);
                content = Encoding.ASCII.GetBytes(pem);
                fileName = $"{name}.pem";
                contentType = "application/x-pem-file";
                break;
            case "der":
            case "crt":
                content = certificate.RawData;
                fileName = $"{name}.{kind}";
                contentType = "application/x-x509-ca-cert";
                break;
            case "p7b":
                {
                    var collection = new X509Certificate2Collection { certificate };
                    if (issuer is not null) collection.Add(issuer);
                    content = collection.Export(X509ContentType.Pkcs7) ?? throw new AppValidationException("certificate_export_failed");
                }
                fileName = $"{name}.p7b";
                contentType = "application/x-pkcs7-certificates";
                break;
            case "p12":
            case "pfx":
                {
                    var collection = new X509Certificate2Collection { certificate };
                    if (issuer is not null) collection.Add(issuer);
                    content = collection.Export(X509ContentType.Pkcs12, password) ?? throw new AppValidationException("certificate_export_failed");
                }
                var ext = kind == "p12" ? "p12" : "pfx";
                fileName = $"{name}.{ext}";
                contentType = "application/x-pkcs12";
                break;
            case "key":
                using (var rsa = certificate.GetRSAPrivateKey())
                using (var ecdsa = certificate.GetECDsaPrivateKey())
                {
                    var pkcs8 = rsa is not null ? rsa.ExportEncryptedPkcs8PrivateKey(password!, KeyEncryption) :
                        ecdsa?.ExportEncryptedPkcs8PrivateKey(password!, KeyEncryption) ?? throw new AppValidationException("private_key_missing");
                    content = Encoding.ASCII.GetBytes(PemEncoding.WriteString("ENCRYPTED PRIVATE KEY", pkcs8));
                    CryptographicOperations.ZeroMemory(pkcs8);
                }
                fileName = $"{name}.key";
                contentType = "application/pkcs8";
                break;
            default: throw new AppValidationException("unsupported_export_format");
        }
        return new CertificateDownload(content, fileName, contentType);
    }

    private static string SafeFileName(string value)
    {
        var clean = Regex.Replace(value, @"[^a-zA-Z0-9._-]+", "-").Trim('-', '.');
        return clean.Length == 0 ? "certificate" : clean[..Math.Min(clean.Length, 80)];
    }

    private static string SafeFileNameForSubject(string subject) => SafeFileName(subject.Split(',')[0].Replace("CN=", string.Empty, StringComparison.OrdinalIgnoreCase));
}

public sealed class AppValidationException(string code, Exception? innerException = null) : Exception(code, innerException)
{
    public string Code { get; } = code;
}

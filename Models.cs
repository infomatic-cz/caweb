using System.Text.Json.Serialization;

namespace CAWeb;

public sealed record AppUser(
    string Id,
    string Username,
    string FullName,
    string Email,
    string PasswordHash,
    string Language,
    string Role,
    string Status,
    int FailedLogins,
    DateTimeOffset? LockoutUntil,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLogin);

public sealed record CertificateAuthorityRecord(
    byte[] CertificateDer,
    byte[] ProtectedPrivateKey,
    string KeyAlgorithm,
    string Subject,
    string Thumbprint,
    DateTimeOffset NotBefore,
    DateTimeOffset NotAfter,
    bool Imported,
    DateTimeOffset UpdatedAt);

public sealed record ServerRecord(
    string Id,
    string Name,
    string Description,
    string ServerType,
    string CommonName,
    string Country,
    string State,
    string Locality,
    string Organization,
    string OrganizationalUnit,
    string[] DnsNames,
    string[] IpAddresses,
    string[] KeyUsage,
    string KeyAlgorithm,
    int ValidDays,
    byte[]? CertificateDer,
    byte[]? ProtectedPrivateKey,
    string? IssuedSubject,
    string? IssuerThumbprint,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? IssuedParametersJson,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AuditEntry(string Action, string Entity, string EntityId, string Detail);

public sealed record SmtpSettings(
    string Host,
    int Port,
    string FromAddress,
    string Username,
    string ProtectedPassword,
    bool UseTls);

public sealed record SetupRequest(
    string FullName,
    string Email,
    string Password,
    string ConfirmPassword,
    string Language,
    string SmtpHost,
    int SmtpPort,
    string SmtpFrom,
    string SmtpUsername,
    string SmtpPassword,
    bool SmtpUseTls);

public sealed record LoginRequest(string Username, string Password);
public sealed record RegistrationRequest(string Username, string FullName, string Email, string Password, string Language);
public sealed record UserCreateRequest(string Username, string FullName, string Email, string Password, string Language, string Role);
public sealed record UserUpdateRequest(string FullName, string Email, string Language, string Status, string Role, string? Password);
public sealed record UserDecisionRequest(string Decision);
public sealed record LanguageRequest(string Language);

public sealed record ServerInput(
    string Name,
    string Description,
    string ServerType,
    string CommonName,
    string Country,
    string State,
    string Locality,
    string Organization,
    string OrganizationalUnit,
    string[] DnsNames,
    string[] IpAddresses,
    string[] KeyUsage,
    string KeyAlgorithm,
    int ValidDays);

public sealed record IssueRequest(string Password, string ConfirmPassword, bool ReviewConfirmed);
public sealed record ExportRequest(string Format, string? Password);
public sealed record SmtpUpdateRequest(string Host, int Port, string FromAddress, string Username, string? Password, bool UseTls, bool RegistrationEnabled);
public sealed record TestEmailRequest(string Recipient);

public sealed record CaGenerateRequest(
    string CommonName,
    string Country,
    string State,
    string Locality,
    string Organization,
    string OrganizationalUnit,
    string KeyAlgorithm,
    int RsaBits,
    int ValidDays,
    string Password,
    string ConfirmPassword,
    bool ConfirmReplacement);

public sealed record CaImportResult(string Mode, string? Password);

public sealed record CaSummary(
    string Subject,
    string Thumbprint,
    string KeyAlgorithm,
    DateTimeOffset NotBefore,
    DateTimeOffset NotAfter,
    bool Imported,
    bool IsExpired,
    string SerialNumber,
    int ServerCount);

public sealed record ServerSummary(
    string Id,
    string Name,
    string Description,
    string ServerType,
    string CommonName,
    string[] DnsNames,
    string[] IpAddresses,
    string[] KeyUsage,
    string KeyAlgorithm,
    int ValidDays,
    string Status,
    string StatusDetail,
    string? IssuedSubject,
    string? IssuerThumbprint,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    bool ParametersChanged,
    string Country,
    string State,
    string Locality,
    string Organization,
    string OrganizationalUnit);

public static class InputValidation
{
    public static string Clean(string? value, int maxLength = 300) =>
        (value ?? string.Empty).Trim().Replace("\0", string.Empty)[..Math.Min((value ?? string.Empty).Trim().Replace("\0", string.Empty).Length, maxLength)];

    public static string[] CleanList(string[]? values, int maxItems, int maxLength = 253) =>
        (values ?? [])
            .Select(value => Clean(value, maxLength))
            .Where(value => value.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxItems)
            .ToArray();

    public static bool IsValidLanguage(string language) => language is "cs" or "en";

    public static bool IsValidUsername(string username) =>
        username.Length is >= 3 and <= 64 && username.All(character => char.IsLetterOrDigit(character) || character is '.' or '_' or '-');

    public static bool IsValidEmail(string email) =>
        email.Length <= 254 && System.Net.Mail.MailAddress.TryCreate(email, out var parsed) && parsed.Address.Equals(email, StringComparison.OrdinalIgnoreCase);
}

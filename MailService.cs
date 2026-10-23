using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.DataProtection;

namespace CAWeb;

public sealed class MailService(AppDatabase database, IDataProtectionProvider protectionProvider)
{
    private readonly IDataProtector _protector = protectionProvider.CreateProtector("CAWeb.smtp-password.v1");

    public async Task<bool> IsConfiguredAsync(CancellationToken cancellationToken = default)
    {
        var host = await database.GetSettingAsync("smtp.host", cancellationToken);
        var from = await database.GetSettingAsync("smtp.from", cancellationToken);
        return !string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(from);
    }

    public async Task SaveAsync(string host, int port, string from, string username, string? password, bool useTls, CancellationToken cancellationToken = default)
    {
        host = InputValidation.Clean(host, 253);
        from = InputValidation.Clean(from, 254);
        username = InputValidation.Clean(username, 254);
        if (host.Length == 0)
        {
            await database.SetSettingAsync("smtp.host", string.Empty, cancellationToken);
            await database.SetSettingAsync("smtp.from", string.Empty, cancellationToken);
            await database.SetSettingAsync("smtp.username", string.Empty, cancellationToken);
            await database.SetSettingAsync("smtp.password", string.Empty, cancellationToken);
            await database.SetSettingAsync("smtp.port", "587", cancellationToken);
            await database.SetSettingAsync("smtp.tls", "true", cancellationToken);
            return;
        }
        if (port is < 1 or > 65535 || !InputValidation.IsValidEmail(from)) throw new AppValidationException("invalid_smtp_settings");

        var priorPassword = await database.GetSettingAsync("smtp.password", cancellationToken);
        var storedPassword = string.IsNullOrEmpty(password) ? priorPassword ?? string.Empty : _protector.Protect(password);
        await database.SetSettingAsync("smtp.host", host, cancellationToken);
        await database.SetSettingAsync("smtp.port", port.ToString(System.Globalization.CultureInfo.InvariantCulture), cancellationToken);
        await database.SetSettingAsync("smtp.from", from, cancellationToken);
        await database.SetSettingAsync("smtp.username", username, cancellationToken);
        await database.SetSettingAsync("smtp.password", storedPassword, cancellationToken);
        await database.SetSettingAsync("smtp.tls", useTls ? "true" : "false", cancellationToken);
    }

    public async Task SendAsync(string recipient, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (!InputValidation.IsValidEmail(recipient)) throw new AppValidationException("invalid_email");
        var host = await database.GetSettingAsync("smtp.host", cancellationToken);
        var from = await database.GetSettingAsync("smtp.from", cancellationToken);
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from)) throw new AppValidationException("smtp_not_configured");
        var port = int.TryParse(await database.GetSettingAsync("smtp.port", cancellationToken), out var parsedPort) ? parsedPort : 587;
        var username = await database.GetSettingAsync("smtp.username", cancellationToken) ?? string.Empty;
        var protectedPassword = await database.GetSettingAsync("smtp.password", cancellationToken) ?? string.Empty;
        var password = string.IsNullOrEmpty(protectedPassword) ? string.Empty : _protector.Unprotect(protectedPassword);
        var useTls = !string.Equals(await database.GetSettingAsync("smtp.tls", cancellationToken), "false", StringComparison.OrdinalIgnoreCase);

        using var message = new MailMessage(from, recipient, subject, body) { IsBodyHtml = false };
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = useTls,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 15_000
        };
        if (!string.IsNullOrWhiteSpace(username))
        {
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(username, password);
        }
        await client.SendMailAsync(message, cancellationToken);
    }
}

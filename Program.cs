using System.Security.Claims;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Data.Sqlite;

namespace CAWeb;

public static class Program
{
    private static readonly SemaphoreSlim SetupLock = new(1, 1);

    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var dataDirectory = ResolveDataDirectory(builder.Environment);
        Directory.CreateDirectory(dataDirectory);

        builder.Services.Configure<FormOptions>(options => options.MultipartBodyLengthLimit = 15 * 1024 * 1024);
        var dataProtection = builder.Services.AddDataProtection()
            .SetApplicationName("CAWeb")
            .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDirectory, "keys")));
        if (OperatingSystem.IsWindows()) dataProtection.ProtectKeysWithDpapi(protectToLocalMachine: true);
        builder.Services.AddSingleton(new AppDatabase(dataDirectory));
        builder.Services.AddSingleton<MailService>();
        builder.Services.AddSingleton<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
        builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
        {
            options.Cookie.Name = ".CAWeb.Session";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
            options.ExpireTimeSpan = TimeSpan.FromHours(8);
            options.SlidingExpiration = true;
            options.LoginPath = "/";
            options.AccessDeniedPath = "/";
            options.Events.OnRedirectToLogin = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }
                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            };
        });
        builder.Services.AddAuthorization();

        var app = builder.Build();
        await app.Services.GetRequiredService<AppDatabase>().InitializeAsync();

        app.Use(async (context, next) =>
        {
            context.Response.Headers.XContentTypeOptions = "nosniff";
            context.Response.Headers.XFrameOptions = "DENY";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            context.Response.Headers.ContentSecurityPolicy = "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'";
            if (!app.Environment.IsDevelopment()) context.Response.Headers.StrictTransportSecurity = "max-age=31536000; includeSubDomains";

            if (context.Request.Path.StartsWithSegments("/api") && IsWriteMethod(context.Request.Method) &&
                !string.Equals(context.Request.Headers["X-CAWeb-Request"], "1", StringComparison.Ordinal))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { error = "csrf_header_required" });
                return;
            }
            await next();
        });

        app.Use(async (context, next) =>
        {
            try { await next(); }
            catch (AppValidationException exception)
            {
                if (context.Response.HasStarted) throw;
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = exception.Code });
            }
            catch (SqliteException exception) when (exception.SqliteErrorCode == 19)
            {
                if (context.Response.HasStarted) throw;
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                await context.Response.WriteAsJsonAsync(new { error = "conflict" });
            }
            catch (Exception exception)
            {
                app.Logger.LogError(exception, "Unhandled application error.");
                if (context.Response.HasStarted) throw;
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new { error = "server_error" });
            }
        });

        app.UseAuthentication();
        app.UseAuthorization();
        app.UseDefaultFiles();
        app.UseStaticFiles();

        var database = app.Services.GetRequiredService<AppDatabase>();
        var mail = app.Services.GetRequiredService<MailService>();
        var protector = app.Services.GetRequiredService<IDataProtectionProvider>().CreateProtector("CAWeb.certificate-private-key.v1");
        var passwordHasher = app.Services.GetRequiredService<IPasswordHasher<AppUser>>();

        app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
        app.MapGet("/api/status", async (HttpContext context, CancellationToken cancellationToken) =>
        {
            var count = await database.CountUsersAsync(cancellationToken);
            AppUser? current = null;
            var id = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(id))
            {
                current = await database.GetUserByIdAsync(id, cancellationToken);
                if (current?.Status != "active") current = null;
            }
            return Results.Ok(new
            {
                setupRequired = count == 0,
                registrationEnabled = !string.Equals(await database.GetSettingAsync("registration.enabled", cancellationToken), "false", StringComparison.OrdinalIgnoreCase),
                authenticated = current is not null,
                user = current is null ? null : PublicUser(current),
                version = typeof(Program).Assembly.GetName().Version?.ToString(3) ?? "0.0.0"
            });
        });

        app.MapPost("/api/setup", async (SetupRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            await SetupLock.WaitAsync(cancellationToken);
            try
            {
                if (await database.CountUsersAsync(cancellationToken) > 0) return Results.Conflict(new { error = "setup_already_completed" });
                var fullName = InputValidation.Clean(input.FullName, 120);
                var email = InputValidation.Clean(input.Email, 254);
                ValidatePassword(input.Password, input.ConfirmPassword, minimumLength: 14);
                if (fullName.Length == 0 || !InputValidation.IsValidEmail(email) || !InputValidation.IsValidLanguage(input.Language))
                    throw new AppValidationException("invalid_setup_details");

                if (!string.IsNullOrWhiteSpace(input.SmtpHost))
                    await mail.SaveAsync(input.SmtpHost, input.SmtpPort, input.SmtpFrom, input.SmtpUsername, input.SmtpPassword, input.SmtpUseTls, cancellationToken);

                var now = DateTimeOffset.UtcNow;
                var user = new AppUser(Guid.NewGuid().ToString("N"), "admin", fullName, email, string.Empty, input.Language, "admin", "active", 0, null, now, null);
                user = user with { PasswordHash = passwordHasher.HashPassword(user, input.Password) };
                await database.CreateUserAsync(user, cancellationToken);
                await database.SetSettingAsync("registration.enabled", "true", cancellationToken);
                await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("created", "application", "setup", "First-run setup completed."), cancellationToken);
                await SignInAsync(context, user);
                return Results.Ok(new { user = PublicUser(user) });
            }
            finally { SetupLock.Release(); }
        });

        app.MapPost("/api/login", async (LoginRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var username = InputValidation.Clean(input.Username, 64);
            var user = await database.GetUserByUsernameAsync(username, cancellationToken);
            if (user is null) return Results.Json(new { error = "invalid_credentials" }, statusCode: StatusCodes.Status401Unauthorized);
            if (user.LockoutUntil > DateTimeOffset.UtcNow) return Results.Json(new { error = "account_locked" }, statusCode: StatusCodes.Status429TooManyRequests);

            var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, input.Password ?? string.Empty);
            if (result == PasswordVerificationResult.Failed)
            {
                var failures = user.FailedLogins + 1;
                DateTimeOffset? lockout = failures >= 5 ? DateTimeOffset.UtcNow.AddMinutes(failures >= 10 ? 30 : 5) : null;
                await database.RecordLoginFailureAsync(user.Id, failures, lockout, cancellationToken);
                return Results.Json(new { error = "invalid_credentials" }, statusCode: StatusCodes.Status401Unauthorized);
            }
            if (user.Status == "pending") return Results.Json(new { error = "approval_required" }, statusCode: StatusCodes.Status403Forbidden);
            if (user.Status != "active") return Results.Json(new { error = "account_disabled" }, statusCode: StatusCodes.Status403Forbidden);
            await database.RecordLoginSuccessAsync(user.Id, cancellationToken);
            await SignInAsync(context, user);
            return Results.Ok(new { user = PublicUser(user) });
        });

        app.MapPost("/api/register", async (RegistrationRequest input, CancellationToken cancellationToken) =>
        {
            await SetupLock.WaitAsync(cancellationToken);
            try
            {
                if (await database.CountUsersAsync(cancellationToken) == 0 ||
                    string.Equals(await database.GetSettingAsync("registration.enabled", cancellationToken), "false", StringComparison.OrdinalIgnoreCase))
                    return Results.NotFound();
                var username = InputValidation.Clean(input.Username, 64);
                var fullName = InputValidation.Clean(input.FullName, 120);
                var email = InputValidation.Clean(input.Email, 254);
                ValidatePassword(input.Password, input.Password, minimumLength: 12);
                if (!InputValidation.IsValidUsername(username) || fullName.Length == 0 || !InputValidation.IsValidEmail(email) || !InputValidation.IsValidLanguage(input.Language))
                    throw new AppValidationException("invalid_registration");
                var now = DateTimeOffset.UtcNow;
                var user = new AppUser(Guid.NewGuid().ToString("N"), username, fullName, email, string.Empty, input.Language, "user", "pending", 0, null, now, null);
                user = user with { PasswordHash = passwordHasher.HashPassword(user, input.Password) };
                await database.CreateUserAsync(user, cancellationToken);
                await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("requested", "user", user.Id, "Registration request submitted for approval."), cancellationToken);
                var admin = (await database.GetUsersAsync(cancellationToken)).FirstOrDefault(candidate => candidate.Role == "admin" && candidate.Status == "active");
                if (admin is not null && await mail.IsConfiguredAsync(cancellationToken))
                {
                    var subject = admin.Language == "en" ? "CAWeb: approval required" : "CAWeb: čeká žádost o přístup";
                    var body = admin.Language == "en"
                        ? $"A new account request from {user.Username} is waiting for review."
                        : $"Nová žádost o přístup od uživatele {user.Username} čeká na vaše rozhodnutí.";
                    try { await mail.SendAsync(admin.Email, subject, body, cancellationToken); }
                    catch (Exception exception) { app.Logger.LogWarning(exception, "Registration notification could not be sent."); }
                }
                return Results.Accepted("/", new { status = "pending" });
            }
            finally { SetupLock.Release(); }
        });

        app.MapPost("/api/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok(new { signedOut = true });
        }).RequireAuthorization();

        var api = app.MapGroup("/api").RequireAuthorization();
        api.AddEndpointFilter(async (invocation, next) =>
        {
            var userId = invocation.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var current = string.IsNullOrWhiteSpace(userId) ? null : await database.GetUserByIdAsync(userId, invocation.HttpContext.RequestAborted);
            if (current?.Status != "active") return Results.Unauthorized();
            invocation.HttpContext.Items[typeof(AppUser)] = current;
            return await next(invocation);
        });

        api.MapGet("/me", (HttpContext context) => Results.Ok(PublicUser(CurrentUser(context))));
        api.MapPut("/me/language", async (LanguageRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            if (!InputValidation.IsValidLanguage(input.Language)) throw new AppValidationException("invalid_language");
            var user = CurrentUser(context);
            await database.UpdateUserProfileAsync(user.Id, user.FullName, user.Email, input.Language, user.Role, user.Status, cancellationToken);
            await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, CreatePrincipal(user with { Language = input.Language }));
            return Results.Ok(new { language = input.Language });
        });

        api.MapGet("/overview", async (HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            var authority = await database.GetAuthorityAsync(cancellationToken);
            var servers = await database.GetServersAsync(cancellationToken);
            var summaries = servers.Select(server => CertificateService.Summarize(server, authority)).ToArray();
            var users = user.Role == "admin" ? await database.GetUsersAsync(cancellationToken) : [];
            var recent = user.Role == "admin" ? await database.GetRecentAuditAsync(cancellationToken: cancellationToken) : [];
            return Results.Ok(new
            {
                user = PublicUser(user),
                authority = authority is null ? null : ToAuthoritySummary(authority, servers.Count),
                servers = summaries,
                counts = new { servers = summaries.Length, activeCertificates = summaries.Count(item => item.Status == "active"), expiringCertificates = summaries.Count(item => item.Status == "expiring"), needsAttention = summaries.Count(item => item.Status is "not-issued" or "expired" or "review" or "ca-changed"), pendingUsers = users.Count(item => item.Status == "pending") },
                smtpConfigured = await mail.IsConfiguredAsync(cancellationToken),
                registrationEnabled = !string.Equals(await database.GetSettingAsync("registration.enabled", cancellationToken), "false", StringComparison.OrdinalIgnoreCase),
                recentActivity = recent
            });
        });

        api.MapGet("/ca", async (CancellationToken cancellationToken) =>
        {
            var authority = await database.GetAuthorityAsync(cancellationToken);
            if (authority is null) return Results.Ok(new { configured = false, authority = (CaSummary?)null });
            return Results.Ok(new { configured = true, authority = ToAuthoritySummary(authority, (await database.GetServersAsync(cancellationToken)).Count) });
        });

        api.MapPost("/ca/generate", async (CaGenerateRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            var existing = await database.GetAuthorityAsync(cancellationToken);
            if (existing is not null && !input.ConfirmReplacement) throw new AppValidationException("ca_replacement_confirmation_required");
            var generated = CertificateService.GenerateAuthority(input, protector);
            var authority = SaveRecord(generated);
            await database.SaveAuthorityAsync(authority, cancellationToken);
            await database.AddAuditAsync(current.Id, current.Username, new AuditEntry(existing is null ? "created" : "renewed", "authority", authority.Thumbprint, authority.Subject), cancellationToken);
            return Results.Ok(new { authority = ToAuthoritySummary(authority, (await database.GetServersAsync(cancellationToken)).Count) });
        });

        api.MapPost("/ca/import", async (HttpRequest request, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            var form = await request.ReadFormAsync(cancellationToken);
            var existing = await database.GetAuthorityAsync(cancellationToken);
            var confirmReplacement = string.Equals(form["confirmReplacement"], "true", StringComparison.OrdinalIgnoreCase);
            if (existing is not null && !confirmReplacement) throw new AppValidationException("ca_replacement_confirmation_required");
            var mode = InputValidation.Clean(form["mode"], 16);
            var password = form["password"].ToString();
            var pfxBytes = await ReadUploadAsync(form.Files.GetFile("pfxFile"), cancellationToken);
            var certBytes = await ReadUploadAsync(form.Files.GetFile("certificateFile"), cancellationToken);
            var keyBytes = await ReadUploadAsync(form.Files.GetFile("keyFile"), cancellationToken);
            var material = CertificateService.ImportAuthority(mode, pfxBytes, certBytes, keyBytes, password, protector);
            var authority = SaveRecord(material);
            await database.SaveAuthorityAsync(authority, cancellationToken);
            await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("imported", "authority", authority.Thumbprint, authority.Subject), cancellationToken);
            return Results.Ok(new { authority = ToAuthoritySummary(authority, (await database.GetServersAsync(cancellationToken)).Count) });
        });

        api.MapPost("/ca/export", async (ExportRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            if (!IsAdmin(user)) return Results.Forbid();
            var authority = await database.GetAuthorityAsync(cancellationToken) ?? throw new AppValidationException("ca_not_configured");
            ValidateExportPassword(input.Format, input.Password);
            var download = CertificateService.ExportAuthority(authority, input.Format, input.Password, protector);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("exported", "authority", authority.Thumbprint, input.Format), cancellationToken);
            return Results.File(download.Content, download.ContentType, download.FileName);
        });

        api.MapGet("/servers", async (CancellationToken cancellationToken) =>
        {
            var authority = await database.GetAuthorityAsync(cancellationToken);
            var servers = await database.GetServersAsync(cancellationToken);
            return Results.Ok(servers.Select(server => CertificateService.Summarize(server, authority)));
        });

        api.MapPost("/servers", async (ServerInput input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            var server = BuildServer(input, null);
            CertificateService.ValidateServer(server);
            await database.SaveServerAsync(server, cancellationToken);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("created", "server", server.Id, server.Name), cancellationToken);
            return Results.Created($"/api/servers/{server.Id}", CertificateService.Summarize(server, await database.GetAuthorityAsync(cancellationToken)));
        });

        api.MapPut("/servers/{id}", async (string id, ServerInput input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            var existing = await database.GetServerAsync(id, cancellationToken);
            if (existing is null) return Results.NotFound();
            var updated = BuildServer(input, existing);
            CertificateService.ValidateServer(updated);
            await database.SaveServerAsync(updated, cancellationToken);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("updated", "server", id, updated.Name), cancellationToken);
            return Results.Ok(CertificateService.Summarize(updated, await database.GetAuthorityAsync(cancellationToken)));
        });

        api.MapPost("/servers/{id}/duplicate", async (string id, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            var source = await database.GetServerAsync(id, cancellationToken);
            if (source is null) return Results.NotFound();
            var copy = source with
            {
                Id = Guid.NewGuid().ToString("N"), Name = $"{source.Name} (copy)", CertificateDer = null, ProtectedPrivateKey = null,
                IssuedSubject = null, IssuerThumbprint = null, IssuedAt = null, ExpiresAt = null, IssuedParametersJson = null,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            };
            await database.SaveServerAsync(copy, cancellationToken);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("duplicated", "server", copy.Id, copy.Name), cancellationToken);
            return Results.Created($"/api/servers/{copy.Id}", CertificateService.Summarize(copy, await database.GetAuthorityAsync(cancellationToken)));
        });

        api.MapPost("/servers/{id}/delete", async (string id, ConfirmationRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            if (!input.Confirmed) throw new AppValidationException("delete_confirmation_required");
            var user = CurrentUser(context);
            var existing = await database.GetServerAsync(id, cancellationToken);
            if (existing is null) return Results.NotFound();
            await database.DeleteServerAsync(id, cancellationToken);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("deleted", "server", id, existing.Name), cancellationToken);
            return Results.NoContent();
        });

        api.MapPost("/servers/{id}/issue", async (string id, IssueRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            var authority = await database.GetAuthorityAsync(cancellationToken) ?? throw new AppValidationException("ca_not_configured");
            var server = await database.GetServerAsync(id, cancellationToken);
            if (server is null) return Results.NotFound();
            var issued = CertificateService.IssueServer(authority, server, input, protector);
            await database.SaveServerCertificateAsync(server.Id, issued.CertificateDer, issued.ProtectedPrivateKey, issued.Subject, issued.IssuerThumbprint, issued.IssuedAt, issued.ExpiresAt, issued.ParameterSnapshot, cancellationToken);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("issued", "certificate", server.Id, server.Name), cancellationToken);
            return Results.File(issued.PfxDownload.Content, issued.PfxDownload.ContentType, issued.PfxDownload.FileName);
        });

        api.MapPost("/servers/{id}/export", async (string id, ExportRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            var server = await database.GetServerAsync(id, cancellationToken);
            if (server is null) return Results.NotFound();
            ValidateExportPassword(input.Format, input.Password);
            var download = CertificateService.ExportServer(await database.GetAuthorityAsync(cancellationToken), server, input.Format, input.Password, protector);
            await database.AddAuditAsync(user.Id, user.Username, new AuditEntry("exported", "certificate", id, input.Format), cancellationToken);
            return Results.File(download.Content, download.ContentType, download.FileName);
        });

        api.MapGet("/users", async (HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            if (!IsAdmin(user)) return Results.Forbid();
            return Results.Ok((await database.GetUsersAsync(cancellationToken)).Select(PublicUser));
        });

        api.MapPost("/users", async (UserCreateRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            var username = InputValidation.Clean(input.Username, 64);
            var name = InputValidation.Clean(input.FullName, 120);
            var email = InputValidation.Clean(input.Email, 254);
            var role = input.Role == "admin" ? "admin" : "user";
            ValidatePassword(input.Password, input.Password, minimumLength: 12);
            if (!InputValidation.IsValidUsername(username) || name.Length == 0 || !InputValidation.IsValidEmail(email) || !InputValidation.IsValidLanguage(input.Language))
                throw new AppValidationException("invalid_user_details");
            var user = new AppUser(Guid.NewGuid().ToString("N"), username, name, email, string.Empty, input.Language, role, "active", 0, null, DateTimeOffset.UtcNow, null);
            user = user with { PasswordHash = passwordHasher.HashPassword(user, input.Password) };
            await database.CreateUserAsync(user, cancellationToken);
            await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("created", "user", user.Id, user.Username), cancellationToken);
            return Results.Created($"/api/users/{user.Id}", PublicUser(user));
        });

        api.MapPut("/users/{id}", async (string id, UserUpdateRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            var target = await database.GetUserByIdAsync(id, cancellationToken);
            if (target is null) return Results.NotFound();
            var name = InputValidation.Clean(input.FullName, 120);
            var email = InputValidation.Clean(input.Email, 254);
            var language = InputValidation.IsValidLanguage(input.Language) ? input.Language : throw new AppValidationException("invalid_language");
            var role = input.Role == "admin" ? "admin" : "user";
            var status = input.Status is "active" or "disabled" ? input.Status : throw new AppValidationException("invalid_user_status");
            if (name.Length == 0 || !InputValidation.IsValidEmail(email)) throw new AppValidationException("invalid_user_details");
            if (target.Id == current.Id && (status != "active" || role != "admin")) throw new AppValidationException("cannot_remove_own_admin_access");
            if (target.Role == "admin" && target.Status == "active" && (role != "admin" || status != "active") && await ActiveAdminCountAsync(database, cancellationToken) <= 1)
                throw new AppValidationException("last_active_admin");
            await database.UpdateUserProfileAsync(id, name, email, language, role, status, cancellationToken);
            if (!string.IsNullOrEmpty(input.Password))
            {
                ValidatePassword(input.Password, input.Password, minimumLength: 12);
                var updated = target with { FullName = name, Email = email, Language = language, Role = role, Status = status };
                await database.UpdateUserPasswordAsync(id, passwordHasher.HashPassword(updated, input.Password), cancellationToken);
            }
            await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("updated", "user", id, target.Username), cancellationToken);
            return Results.Ok(PublicUser((await database.GetUserByIdAsync(id, cancellationToken))!));
        });

        api.MapPost("/users/{id}/decision", async (string id, UserDecisionRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            var target = await database.GetUserByIdAsync(id, cancellationToken);
            if (target is null) return Results.NotFound();
            if (target.Status != "pending") throw new AppValidationException("user_not_pending");
            if (input.Decision == "approve")
            {
                await database.UpdateUserProfileAsync(id, target.FullName, target.Email, target.Language, "user", "active", cancellationToken);
                if (await mail.IsConfiguredAsync(cancellationToken))
                {
                    var subject = target.Language == "en" ? "CAWeb: account approved" : "CAWeb: účet byl schválen";
                    var body = target.Language == "en"
                        ? "Your CAWeb account is ready. You can now sign in."
                        : "Váš účet CAWeb je připraven. Nyní se můžete přihlásit.";
                    try { await mail.SendAsync(target.Email, subject, body, cancellationToken); }
                    catch (Exception exception) { app.Logger.LogWarning(exception, "Approval notification could not be sent."); }
                }
                await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("approved", "user", id, target.Username), cancellationToken);
                return Results.Ok(new { status = "active" });
            }
            if (input.Decision == "reject")
            {
                await database.DeleteUserAsync(id, cancellationToken);
                await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("rejected", "user", id, target.Username), cancellationToken);
                return Results.Ok(new { status = "rejected" });
            }
            throw new AppValidationException("invalid_user_decision");
        });

        api.MapPost("/users/{id}/delete", async (string id, ConfirmationRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            if (!input.Confirmed) throw new AppValidationException("delete_confirmation_required");
            if (id == current.Id) throw new AppValidationException("cannot_delete_self");
            var target = await database.GetUserByIdAsync(id, cancellationToken);
            if (target is null) return Results.NotFound();
            if (target.Role == "admin" && target.Status == "active" && await ActiveAdminCountAsync(database, cancellationToken) <= 1)
                throw new AppValidationException("last_active_admin");
            await database.DeleteUserAsync(id, cancellationToken);
            await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("deleted", "user", id, target.Username), cancellationToken);
            return Results.NoContent();
        });

        api.MapGet("/settings", async (HttpContext context, CancellationToken cancellationToken) =>
        {
            if (!IsAdmin(CurrentUser(context))) return Results.Forbid();
            return Results.Ok(new
            {
                smtp = new
                {
                    host = await database.GetSettingAsync("smtp.host", cancellationToken) ?? string.Empty,
                    port = int.TryParse(await database.GetSettingAsync("smtp.port", cancellationToken), out var port) ? port : 587,
                    fromAddress = await database.GetSettingAsync("smtp.from", cancellationToken) ?? string.Empty,
                    username = await database.GetSettingAsync("smtp.username", cancellationToken) ?? string.Empty,
                    passwordSet = !string.IsNullOrEmpty(await database.GetSettingAsync("smtp.password", cancellationToken)),
                    useTls = !string.Equals(await database.GetSettingAsync("smtp.tls", cancellationToken), "false", StringComparison.OrdinalIgnoreCase)
                },
                registrationEnabled = !string.Equals(await database.GetSettingAsync("registration.enabled", cancellationToken), "false", StringComparison.OrdinalIgnoreCase)
            });
        });

        api.MapPut("/settings", async (SmtpUpdateRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var current = CurrentUser(context);
            if (!IsAdmin(current)) return Results.Forbid();
            await mail.SaveAsync(input.Host, input.Port, input.FromAddress, input.Username, input.Password, input.UseTls, cancellationToken);
            await database.SetSettingAsync("registration.enabled", input.RegistrationEnabled ? "true" : "false", cancellationToken);
            await database.AddAuditAsync(current.Id, current.Username, new AuditEntry("updated", "settings", "smtp", "SMTP and registration settings updated."), cancellationToken);
            return Results.Ok(new { smtpConfigured = await mail.IsConfiguredAsync(cancellationToken), registrationEnabled = input.RegistrationEnabled });
        });

        api.MapPost("/settings/test-email", async (TestEmailRequest input, HttpContext context, CancellationToken cancellationToken) =>
        {
            var user = CurrentUser(context);
            if (!IsAdmin(user)) return Results.Forbid();
            var recipient = InputValidation.Clean(input.Recipient, 254);
            var subject = user.Language == "en" ? "CAWeb SMTP test" : "CAWeb: test SMTP";
            var body = user.Language == "en"
                ? "CAWeb can send mail through this SMTP configuration."
                : "CAWeb může odesílat e-maily pomocí tohoto nastavení SMTP.";
            await mail.SendAsync(recipient, subject, body, cancellationToken);
            return Results.Ok(new { sent = true });
        });

        app.MapFallbackToFile("index.html");
        await app.RunAsync();
    }

    private static string ResolveDataDirectory(IWebHostEnvironment environment)
    {
        var configured = Environment.GetEnvironmentVariable("CAWEB_DATA_DIR");
        if (!string.IsNullOrWhiteSpace(configured)) return Path.GetFullPath(configured);
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "CAWeb", "data");
    }

    private static bool IsWriteMethod(string method) => method is "POST" or "PUT" or "PATCH" or "DELETE";

    private static AppUser CurrentUser(HttpContext context) => context.Items[typeof(AppUser)] as AppUser ??
        throw new AppValidationException("unauthenticated");

    private static bool IsAdmin(AppUser user) => user.Role == "admin";

    private static object PublicUser(AppUser user) => new
    {
        id = user.Id,
        username = user.Username,
        fullName = user.FullName,
        email = user.Email,
        language = user.Language,
        role = user.Role,
        status = user.Status,
        createdAt = user.CreatedAt,
        lastLogin = user.LastLogin
    };

    private static X509Certificate2 AuthorityCertificate(CertificateAuthorityRecord authority) => new(authority.CertificateDer);

    private static CaSummary ToAuthoritySummary(CertificateAuthorityRecord authority, int serverCount)
    {
        using var certificate = AuthorityCertificate(authority);
        return new CaSummary(authority.Subject, authority.Thumbprint, authority.KeyAlgorithm, authority.NotBefore, authority.NotAfter,
            authority.Imported, authority.NotAfter <= DateTimeOffset.UtcNow, certificate.SerialNumber, serverCount);
    }

    private static CertificateAuthorityRecord SaveRecord(CertificateMaterial material) => new(
        material.CertificateDer, material.ProtectedPrivateKey, material.KeyAlgorithm, material.Subject, material.Thumbprint,
        material.NotBefore, material.NotAfter, material.Imported, DateTimeOffset.UtcNow);

    private static async Task<byte[]?> ReadUploadAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return null;
        if (file.Length > 10 * 1024 * 1024) throw new AppValidationException("upload_too_large");
        await using var stream = new MemoryStream((int)file.Length);
        await file.CopyToAsync(stream, cancellationToken);
        return stream.ToArray();
    }

    private static ServerRecord BuildServer(ServerInput input, ServerRecord? existing)
    {
        var now = DateTimeOffset.UtcNow;
        var algorithm = input.KeyAlgorithm?.Equals("ECDSA", StringComparison.OrdinalIgnoreCase) == true ? "ECDSA" : "RSA";
        var commonName = InputValidation.Clean(input.CommonName, 253);
        var dnsNames = InputValidation.CleanList(input.DnsNames, 100);
        var ipAddresses = InputValidation.CleanList(input.IpAddresses, 100, 64).ToList();
        if (IPAddress.TryParse(commonName, out _))
        {
            if (!ipAddresses.Contains(commonName, StringComparer.OrdinalIgnoreCase)) ipAddresses.Add(commonName);
        }
        else if (commonName.Length > 0 && !dnsNames.Contains(commonName, StringComparer.OrdinalIgnoreCase))
        {
            dnsNames = dnsNames.Append(commonName).Take(100).ToArray();
        }
        return new ServerRecord(existing?.Id ?? Guid.NewGuid().ToString("N"), InputValidation.Clean(input.Name, 100), InputValidation.Clean(input.Description, 1000),
            input.ServerType?.Equals("Tomcat", StringComparison.OrdinalIgnoreCase) == true ? "Tomcat" : "IIS", commonName,
            InputValidation.Clean(input.Country, 2).ToUpperInvariant(), InputValidation.Clean(input.State, 100), InputValidation.Clean(input.Locality, 100),
            InputValidation.Clean(input.Organization, 150), InputValidation.Clean(input.OrganizationalUnit, 150), dnsNames,
            ipAddresses.ToArray(), InputValidation.CleanList(input.KeyUsage, 5, 40), algorithm,
            Math.Clamp(input.ValidDays, 1, 825), existing?.CertificateDer, existing?.ProtectedPrivateKey, existing?.IssuedSubject, existing?.IssuerThumbprint,
            existing?.IssuedAt, existing?.ExpiresAt, existing?.IssuedParametersJson, existing?.CreatedAt ?? now, now);
    }

    private static async Task<int> ActiveAdminCountAsync(AppDatabase database, CancellationToken cancellationToken) =>
        (await database.GetUsersAsync(cancellationToken)).Count(user => user.Role == "admin" && user.Status == "active");

    private static void ValidatePassword(string password, string confirmPassword, int minimumLength)
    {
        password ??= string.Empty;
        confirmPassword ??= string.Empty;
        if (password.Length < minimumLength || password.Length > 256) throw new AppValidationException("password_too_short");
        if (!CryptographicOperations.FixedTimeEquals(System.Text.Encoding.UTF8.GetBytes(password), System.Text.Encoding.UTF8.GetBytes(confirmPassword)))
            throw new AppValidationException("password_mismatch");
    }

    private static void ValidateExportPassword(string format, string? password)
    {
        if (format is "pfx" or "p12" or "key" && string.IsNullOrWhiteSpace(password)) throw new AppValidationException("export_password_required");
        if (format is "pfx" or "p12" or "key") CertificateService.ValidatePassphrase(password ?? string.Empty, password ?? string.Empty);
    }

    private static ClaimsPrincipal CreatePrincipal(AppUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role),
            new("language", user.Language)
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
    }

    private static async Task SignInAsync(HttpContext context, AppUser user)
    {
        var properties = new AuthenticationProperties { IsPersistent = true, AllowRefresh = true, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8) };
        await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, CreatePrincipal(user), properties);
    }
}

public sealed record ConfirmationRequest(bool Confirmed);

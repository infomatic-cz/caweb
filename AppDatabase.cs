using System.Globalization;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace CAWeb;

public sealed class AppDatabase
{
    private readonly string _connectionString;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public AppDatabase(string dataDirectory)
    {
        Directory.CreateDirectory(dataDirectory);
        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = Path.Combine(dataDirectory, "caweb.db"),
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
            Pooling = true,
            DefaultTimeout = 15
        };
        _connectionString = builder.ToString();
    }

    private async Task<SqliteConnection> OpenAsync(CancellationToken cancellationToken = default)
    {
        var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var pragma = connection.CreateCommand();
        pragma.CommandText = "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 15000;";
        await pragma.ExecuteNonQueryAsync(cancellationToken);
        return connection;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                username_normalized TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'cs',
                role TEXT NOT NULL CHECK(role IN ('admin','user')),
                status TEXT NOT NULL CHECK(status IN ('pending','active','disabled')),
                failed_logins INTEGER NOT NULL DEFAULT 0,
                lockout_until TEXT,
                created_at TEXT NOT NULL,
                last_login TEXT
            );
            CREATE TABLE IF NOT EXISTS settings (
                name TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS certificate_authority (
                singleton_id INTEGER PRIMARY KEY CHECK(singleton_id = 1),
                certificate_der BLOB NOT NULL,
                protected_private_key BLOB NOT NULL,
                key_algorithm TEXT NOT NULL,
                subject TEXT NOT NULL,
                thumbprint TEXT NOT NULL,
                not_before TEXT NOT NULL,
                not_after TEXT NOT NULL,
                imported INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS servers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                server_type TEXT NOT NULL CHECK(server_type IN ('IIS','Tomcat')),
                common_name TEXT NOT NULL,
                country TEXT NOT NULL DEFAULT '',
                state TEXT NOT NULL DEFAULT '',
                locality TEXT NOT NULL DEFAULT '',
                organization TEXT NOT NULL DEFAULT '',
                organizational_unit TEXT NOT NULL DEFAULT '',
                dns_names_json TEXT NOT NULL DEFAULT '[]',
                ip_addresses_json TEXT NOT NULL DEFAULT '[]',
                key_usage_json TEXT NOT NULL DEFAULT '["digitalSignature","keyEncipherment"]',
                key_algorithm TEXT NOT NULL DEFAULT 'RSA',
                valid_days INTEGER NOT NULL DEFAULT 397,
                certificate_der BLOB,
                protected_private_key BLOB,
                issued_subject TEXT,
                issuer_thumbprint TEXT,
                issued_at TEXT,
                expires_at TEXT,
                issued_parameters_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                username TEXT NOT NULL,
                action TEXT NOT NULL,
                entity TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                detail TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_audit_created ON audit_log(created_at DESC);
            """;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<int> CountUsersAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM users";
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken), CultureInfo.InvariantCulture);
    }

    public async Task<AppUser?> GetUserByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await GetUserAsync("id = $value", id, cancellationToken);

    public async Task<AppUser?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken = default) =>
        await GetUserAsync("username_normalized = $value", username.ToUpperInvariant(), cancellationToken);

    private async Task<AppUser?> GetUserAsync(string predicate, string value, CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT id, username, full_name, email, password_hash, language, role, status, failed_logins, lockout_until, created_at, last_login FROM users WHERE {predicate} LIMIT 1";
        command.Parameters.AddWithValue("$value", value);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task<IReadOnlyList<AppUser>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = new List<AppUser>();
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, username, full_name, email, password_hash, language, role, status, failed_logins, lockout_until, created_at, last_login FROM users ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, username COLLATE NOCASE";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) users.Add(ReadUser(reader));
        return users;
    }

    public async Task CreateUserAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "INSERT INTO users(id, username, username_normalized, full_name, email, password_hash, language, role, status, created_at) VALUES($id,$username,$normalized,$name,$email,$hash,$language,$role,$status,$created)";
        command.Parameters.AddWithValue("$id", user.Id);
        command.Parameters.AddWithValue("$username", user.Username);
        command.Parameters.AddWithValue("$normalized", user.Username.ToUpperInvariant());
        command.Parameters.AddWithValue("$name", user.FullName);
        command.Parameters.AddWithValue("$email", user.Email);
        command.Parameters.AddWithValue("$hash", user.PasswordHash);
        command.Parameters.AddWithValue("$language", user.Language);
        command.Parameters.AddWithValue("$role", user.Role);
        command.Parameters.AddWithValue("$status", user.Status);
        command.Parameters.AddWithValue("$created", user.CreatedAt.ToString("O", CultureInfo.InvariantCulture));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateUserProfileAsync(string id, string fullName, string email, string language, string role, string status, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE users SET full_name=$name,email=$email,language=$language,role=$role,status=$status WHERE id=$id";
        command.Parameters.AddWithValue("$name", fullName);
        command.Parameters.AddWithValue("$email", email);
        command.Parameters.AddWithValue("$language", language);
        command.Parameters.AddWithValue("$role", role);
        command.Parameters.AddWithValue("$status", status);
        command.Parameters.AddWithValue("$id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateUserPasswordAsync(string id, string passwordHash, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE users SET password_hash=$hash WHERE id=$id";
        command.Parameters.AddWithValue("$hash", passwordHash);
        command.Parameters.AddWithValue("$id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteUserAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM users WHERE id=$id";
        command.Parameters.AddWithValue("$id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task RecordLoginFailureAsync(string userId, int failures, DateTimeOffset? lockoutUntil, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE users SET failed_logins=$failures, lockout_until=$lockout WHERE id=$id";
        command.Parameters.AddWithValue("$failures", failures);
        command.Parameters.AddWithValue("$lockout", lockoutUntil?.ToString("O", CultureInfo.InvariantCulture) ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$id", userId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task RecordLoginSuccessAsync(string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE users SET failed_logins=0, lockout_until=NULL, last_login=$at WHERE id=$id";
        command.Parameters.AddWithValue("$at", DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("$id", userId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<string?> GetSettingAsync(string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT value FROM settings WHERE name=$name";
        command.Parameters.AddWithValue("$name", name);
        return (string?)await command.ExecuteScalarAsync(cancellationToken);
    }

    public async Task SetSettingAsync(string name, string value, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "INSERT INTO settings(name,value) VALUES($name,$value) ON CONFLICT(name) DO UPDATE SET value=excluded.value";
        command.Parameters.AddWithValue("$name", name);
        command.Parameters.AddWithValue("$value", value);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<CertificateAuthorityRecord?> GetAuthorityAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT certificate_der,protected_private_key,key_algorithm,subject,thumbprint,not_before,not_after,imported,updated_at FROM certificate_authority WHERE singleton_id=1";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new CertificateAuthorityRecord(
            (byte[])reader[0], (byte[])reader[1], reader.GetString(2), reader.GetString(3), reader.GetString(4),
            ParseDate(reader.GetString(5)), ParseDate(reader.GetString(6)), reader.GetInt32(7) == 1, ParseDate(reader.GetString(8)));
    }

    public async Task SaveAuthorityAsync(CertificateAuthorityRecord authority, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO certificate_authority(singleton_id,certificate_der,protected_private_key,key_algorithm,subject,thumbprint,not_before,not_after,imported,updated_at)
            VALUES(1,$certificate,$key,$algorithm,$subject,$thumbprint,$notBefore,$notAfter,$imported,$updated)
            ON CONFLICT(singleton_id) DO UPDATE SET certificate_der=excluded.certificate_der,protected_private_key=excluded.protected_private_key,
            key_algorithm=excluded.key_algorithm,subject=excluded.subject,thumbprint=excluded.thumbprint,not_before=excluded.not_before,
            not_after=excluded.not_after,imported=excluded.imported,updated_at=excluded.updated_at
            """;
        command.Parameters.AddWithValue("$certificate", authority.CertificateDer);
        command.Parameters.AddWithValue("$key", authority.ProtectedPrivateKey);
        command.Parameters.AddWithValue("$algorithm", authority.KeyAlgorithm);
        command.Parameters.AddWithValue("$subject", authority.Subject);
        command.Parameters.AddWithValue("$thumbprint", authority.Thumbprint);
        command.Parameters.AddWithValue("$notBefore", FormatDate(authority.NotBefore));
        command.Parameters.AddWithValue("$notAfter", FormatDate(authority.NotAfter));
        command.Parameters.AddWithValue("$imported", authority.Imported ? 1 : 0);
        command.Parameters.AddWithValue("$updated", FormatDate(authority.UpdatedAt));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<ServerRecord?> GetServerAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id,name,description,server_type,common_name,country,state,locality,organization,organizational_unit,dns_names_json,ip_addresses_json,key_usage_json,key_algorithm,valid_days,certificate_der,protected_private_key,issued_subject,issuer_thumbprint,issued_at,expires_at,issued_parameters_json,created_at,updated_at FROM servers WHERE id=$id";
        command.Parameters.AddWithValue("$id", id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadServer(reader) : null;
    }

    public async Task<IReadOnlyList<ServerRecord>> GetServersAsync(CancellationToken cancellationToken = default)
    {
        var servers = new List<ServerRecord>();
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id,name,description,server_type,common_name,country,state,locality,organization,organizational_unit,dns_names_json,ip_addresses_json,key_usage_json,key_algorithm,valid_days,certificate_der,protected_private_key,issued_subject,issuer_thumbprint,issued_at,expires_at,issued_parameters_json,created_at,updated_at FROM servers ORDER BY name COLLATE NOCASE";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) servers.Add(ReadServer(reader));
        return servers;
    }

    public async Task SaveServerAsync(ServerRecord server, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO servers(id,name,description,server_type,common_name,country,state,locality,organization,organizational_unit,dns_names_json,ip_addresses_json,key_usage_json,key_algorithm,valid_days,certificate_der,protected_private_key,issued_subject,issuer_thumbprint,issued_at,expires_at,issued_parameters_json,created_at,updated_at)
            VALUES($id,$name,$description,$type,$cn,$country,$state,$locality,$organization,$unit,$dns,$ips,$usage,$algorithm,$days,$certificate,$key,$subject,$issuer,$issued,$expires,$snapshot,$created,$updated)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,server_type=excluded.server_type,common_name=excluded.common_name,
            country=excluded.country,state=excluded.state,locality=excluded.locality,organization=excluded.organization,organizational_unit=excluded.organizational_unit,
            dns_names_json=excluded.dns_names_json,ip_addresses_json=excluded.ip_addresses_json,key_usage_json=excluded.key_usage_json,key_algorithm=excluded.key_algorithm,
            valid_days=excluded.valid_days,updated_at=excluded.updated_at
            """;
        command.Parameters.AddWithValue("$id", server.Id);
        command.Parameters.AddWithValue("$name", server.Name);
        command.Parameters.AddWithValue("$description", server.Description);
        command.Parameters.AddWithValue("$type", server.ServerType);
        command.Parameters.AddWithValue("$cn", server.CommonName);
        command.Parameters.AddWithValue("$country", server.Country);
        command.Parameters.AddWithValue("$state", server.State);
        command.Parameters.AddWithValue("$locality", server.Locality);
        command.Parameters.AddWithValue("$organization", server.Organization);
        command.Parameters.AddWithValue("$unit", server.OrganizationalUnit);
        command.Parameters.AddWithValue("$dns", JsonSerializer.Serialize(server.DnsNames, JsonOptions));
        command.Parameters.AddWithValue("$ips", JsonSerializer.Serialize(server.IpAddresses, JsonOptions));
        command.Parameters.AddWithValue("$usage", JsonSerializer.Serialize(server.KeyUsage, JsonOptions));
        command.Parameters.AddWithValue("$algorithm", server.KeyAlgorithm);
        command.Parameters.AddWithValue("$days", server.ValidDays);
        command.Parameters.AddWithValue("$certificate", (object?)server.CertificateDer ?? DBNull.Value);
        command.Parameters.AddWithValue("$key", (object?)server.ProtectedPrivateKey ?? DBNull.Value);
        command.Parameters.AddWithValue("$subject", (object?)server.IssuedSubject ?? DBNull.Value);
        command.Parameters.AddWithValue("$issuer", (object?)server.IssuerThumbprint ?? DBNull.Value);
        command.Parameters.AddWithValue("$issued", (object?)(server.IssuedAt is null ? null : FormatDate(server.IssuedAt.Value)) ?? DBNull.Value);
        command.Parameters.AddWithValue("$expires", (object?)(server.ExpiresAt is null ? null : FormatDate(server.ExpiresAt.Value)) ?? DBNull.Value);
        command.Parameters.AddWithValue("$snapshot", (object?)server.IssuedParametersJson ?? DBNull.Value);
        command.Parameters.AddWithValue("$created", FormatDate(server.CreatedAt));
        command.Parameters.AddWithValue("$updated", FormatDate(server.UpdatedAt));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteServerAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM servers WHERE id=$id";
        command.Parameters.AddWithValue("$id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task SaveServerCertificateAsync(string id, byte[] certificateDer, byte[] protectedPrivateKey, string subject, string issuerThumbprint, DateTimeOffset issuedAt, DateTimeOffset expiresAt, string issuedParametersJson, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE servers SET certificate_der=$certificate,protected_private_key=$key,issued_subject=$subject,issuer_thumbprint=$issuer,issued_at=$issued,expires_at=$expires,issued_parameters_json=$snapshot,updated_at=$updated WHERE id=$id";
        command.Parameters.AddWithValue("$certificate", certificateDer);
        command.Parameters.AddWithValue("$key", protectedPrivateKey);
        command.Parameters.AddWithValue("$subject", subject);
        command.Parameters.AddWithValue("$issuer", issuerThumbprint);
        command.Parameters.AddWithValue("$issued", FormatDate(issuedAt));
        command.Parameters.AddWithValue("$expires", FormatDate(expiresAt));
        command.Parameters.AddWithValue("$snapshot", issuedParametersJson);
        command.Parameters.AddWithValue("$updated", FormatDate(DateTimeOffset.UtcNow));
        command.Parameters.AddWithValue("$id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task AddAuditAsync(string? userId, string username, AuditEntry entry, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "INSERT INTO audit_log(user_id,username,action,entity,entity_id,detail,created_at) VALUES($user,$username,$action,$entity,$entityId,$detail,$created)";
        command.Parameters.AddWithValue("$user", (object?)userId ?? DBNull.Value);
        command.Parameters.AddWithValue("$username", username);
        command.Parameters.AddWithValue("$action", entry.Action);
        command.Parameters.AddWithValue("$entity", entry.Entity);
        command.Parameters.AddWithValue("$entityId", entry.EntityId);
        command.Parameters.AddWithValue("$detail", entry.Detail);
        command.Parameters.AddWithValue("$created", FormatDate(DateTimeOffset.UtcNow));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<object>> GetRecentAuditAsync(int limit = 8, CancellationToken cancellationToken = default)
    {
        var result = new List<object>();
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT username,action,entity,entity_id,detail,created_at FROM audit_log ORDER BY id DESC LIMIT $limit";
        command.Parameters.AddWithValue("$limit", limit);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new { username = reader.GetString(0), action = reader.GetString(1), entity = reader.GetString(2), entityId = reader.GetString(3), detail = reader.GetString(4), createdAt = ParseDate(reader.GetString(5)) });
        return result;
    }

    private static AppUser ReadUser(SqliteDataReader reader) => new(
        reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4), reader.GetString(5),
        reader.GetString(6), reader.GetString(7), reader.GetInt32(8), reader.IsDBNull(9) ? null : ParseDate(reader.GetString(9)),
        ParseDate(reader.GetString(10)), reader.IsDBNull(11) ? null : ParseDate(reader.GetString(11)));

    private static ServerRecord ReadServer(SqliteDataReader reader) => new(
        reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4), reader.GetString(5),
        reader.GetString(6), reader.GetString(7), reader.GetString(8), reader.GetString(9),
        DeserializeArray(reader.GetString(10)), DeserializeArray(reader.GetString(11)), DeserializeArray(reader.GetString(12)),
        reader.GetString(13), reader.GetInt32(14), reader.IsDBNull(15) ? null : (byte[])reader[15], reader.IsDBNull(16) ? null : (byte[])reader[16],
        reader.IsDBNull(17) ? null : reader.GetString(17), reader.IsDBNull(18) ? null : reader.GetString(18),
        reader.IsDBNull(19) ? null : ParseDate(reader.GetString(19)), reader.IsDBNull(20) ? null : ParseDate(reader.GetString(20)),
        reader.IsDBNull(21) ? null : reader.GetString(21), ParseDate(reader.GetString(22)), ParseDate(reader.GetString(23)));

    private static string[] DeserializeArray(string json)
    {
        try { return JsonSerializer.Deserialize<string[]>(json, JsonOptions) ?? []; }
        catch (JsonException) { return []; }
    }

    private static string FormatDate(DateTimeOffset value) => value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
    private static DateTimeOffset ParseDate(string value) => DateTimeOffset.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
}

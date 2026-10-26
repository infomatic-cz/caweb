using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace CAWeb;

public sealed record OperationalLogEntry(
    DateTimeOffset Timestamp,
    string Level,
    string Category,
    string Message,
    string? ReferenceId,
    string? ExceptionType,
    string? ExceptionDetails);

public sealed class OperationalLogStore
{
    private const long MaxFileBytes = 5 * 1024 * 1024;
    private const int MaxExceptionCharacters = 12_000;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly Regex ReferencePattern = new(@"ReferenceId[=: ]+([A-Fa-f0-9]{8,32})", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex SecretPattern = new(@"(?i)\b(password|passwd|passphrase|smtp.?password|access.?token)\b\s*[:=]\s*(?:""[^""]*""|'[^']*'|[^\s,;]+)", RegexOptions.Compiled);
    private static readonly Regex PrivateKeyPattern = new("-----BEGIN [^-]*PRIVATE KEY-----[\\s\\S]*?-----END [^-]*PRIVATE KEY-----", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private readonly string _directory;
    private readonly object _sync = new();

    public OperationalLogStore(string directory)
    {
        _directory = directory;
        Directory.CreateDirectory(_directory);
        RemoveExpiredFiles();
    }

    public void Write(LogLevel level, string category, string message, Exception? exception)
    {
        if (level < LogLevel.Warning || !category.StartsWith("CAWeb", StringComparison.Ordinal)) return;

        var safeMessage = Sanitize(message, 2_000);
        var details = exception is null ? null : Sanitize(exception.ToString(), MaxExceptionCharacters);
        var entry = new OperationalLogEntry(DateTimeOffset.UtcNow, level.ToString(), category,
            safeMessage, ReferencePattern.Match(safeMessage) is { Success: true } match ? match.Groups[1].Value.ToUpperInvariant() : null,
            exception?.GetType().FullName, details);

        try
        {
            lock (_sync)
            {
                var path = NextLogPath(entry.Timestamp.UtcDateTime);
                File.AppendAllText(path, JsonSerializer.Serialize(entry, JsonOptions) + Environment.NewLine);
            }
        }
        catch
        {
            // Logging must never interrupt a certificate operation or an HTTP response.
        }
    }

    public IReadOnlyList<OperationalLogEntry> ReadRecent(int limit = 100)
    {
        var entries = new List<OperationalLogEntry>();
        lock (_sync)
        {
            string[] files;
            try
            {
                files = Directory.EnumerateFiles(_directory, "caweb-*.jsonl")
                    .OrderByDescending(File.GetLastWriteTimeUtc).Take(14).ToArray();
            }
            catch (IOException) { return []; }
            catch (UnauthorizedAccessException) { return []; }

            foreach (var path in files)
            {
                try
                {
                    foreach (var line in File.ReadLines(path).TakeLast(2_000))
                    {
                        try
                        {
                            var entry = JsonSerializer.Deserialize<OperationalLogEntry>(line, JsonOptions);
                            if (entry is not null) entries.Add(entry);
                        }
                        catch (JsonException) { }
                    }
                }
                catch (IOException) { }
                if (entries.Count >= limit * 2) break;
            }
        }
        return entries.OrderByDescending(item => item.Timestamp).Take(Math.Clamp(limit, 1, 200)).ToArray();
    }

    private string NextLogPath(DateTime date)
    {
        var baseName = $"caweb-{date:yyyyMMdd}";
        for (var part = 0; part < 100; part++)
        {
            var suffix = part == 0 ? string.Empty : $"-{part:00}";
            var path = Path.Combine(_directory, $"{baseName}{suffix}.jsonl");
            if (!File.Exists(path) || new FileInfo(path).Length < MaxFileBytes) return path;
        }
        return Path.Combine(_directory, $"{baseName}-{Guid.NewGuid():N}.jsonl");
    }

    private void RemoveExpiredFiles()
    {
        try
        {
            foreach (var path in Directory.EnumerateFiles(_directory, "caweb-*.jsonl"))
                if (File.GetLastWriteTimeUtc(path) < DateTime.UtcNow.AddDays(-30)) File.Delete(path);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private static string Sanitize(string value, int limit)
    {
        var safe = PrivateKeyPattern.Replace(value, "[private key content redacted]");
        safe = SecretPattern.Replace(safe, "$1=[redacted]");
        return safe.Length > limit ? safe[..limit] + "… [truncated]" : safe;
    }
}

public sealed class OperationalLogProvider(OperationalLogStore store) : ILoggerProvider
{
    public ILogger CreateLogger(string categoryName) => new OperationalLogger(categoryName, store);
    public void Dispose() { }

    private sealed class OperationalLogger(string category, OperationalLogStore store) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Warning && category.StartsWith("CAWeb", StringComparison.Ordinal);

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel)) return;
            store.Write(logLevel, category, formatter(state, exception), exception);
        }
    }
}

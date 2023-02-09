using CommandLine;

namespace DataImport;

// ReSharper disable once ClassNeverInstantiated.Global
public class Settings : IImportRequest
{
    [Option("filePath", Required = true)]
    public string AccessDatabaseFilePath { get; set; } = null!;

    [Option("hostName", Required = false)]
    public string AzureCosmosHostName { get; set; } = null!;

    [Option("key", Required = false)]
    public string AzureCosmosKey { get; set; } = null!;

    [Option("purge", Required = false, Default = false)]
    public bool Purge { get; set; }

    [Option("database", Required = false)]
    public string? DatabaseName { get; set; }

    [Option("division", Required = false)]
    public Guid DivisionId { get; set; }

    [Option("season", Required = false)]
    public Guid SeasonId { get; set; }

    [Option("userName", Required = false, Default = "importer")]
    public string UserName { get; set; } = null!;

    [Option("commit", Required = false, Default = false)]
    public bool Commit { get; set; }

    [Option("api", Required = false)]
    public string? ApiHostName { get; set; }

    public static Task Parse(string[] args, Func<Settings, Task> runImport, Action<IEnumerable<Error>>? abort = null)
    {
        return Parser.Default.ParseArguments<Settings>(args)
            .WithNotParsed(abort ?? (_ => { }))
            .WithParsedAsync(runImport);
    }
}
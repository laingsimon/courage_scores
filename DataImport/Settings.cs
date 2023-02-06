using CommandLine;

namespace DataImport;

// ReSharper disable once ClassNeverInstantiated.Global
public class Settings
{
    [Option("filePath", Required = true)]
    public string AccessDatabaseFilePath { get; set; } = null!;

    [Option("hostName", Required = false)]
    public string AzureCosmosHostName { get; set; } = null!;

    [Option("key", Required = false)]
    public string AzureCosmosKey { get; set; } = null!;

    [Option("purge", Required = false, Default = false)]
    public bool Purge { get; set; }

    [Option("database", Required = false, Default = false)]
    public string? DatabaseName { get; set; }

    [Option("division", Required = false, Default = false)]
    public Guid DivisionId { get; set; }

    [Option("season", Required = false, Default = false)]
    public Guid SeasonId { get; set; }

    public static Task Parse(string[] args, Func<Settings, Task> runImport, Action<IEnumerable<Error>>? abort = null)
    {
        return Parser.Default.ParseArguments<Settings>(args)
            .WithNotParsed(abort ?? (_ => { }))
            .WithParsedAsync(runImport);
    }
}
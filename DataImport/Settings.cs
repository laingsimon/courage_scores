using CommandLine;

namespace DataImport;

// ReSharper disable once ClassNeverInstantiated.Global
public class Settings
{
    [Option('f', "filePath", Required = true)]
    public string AccessDatabaseFilePath { get; set; } = null!;

    [Option('h', "hostName", Required = false)]
    public string AzureCosmosHostName { get; set; } = null!;

    [Option('k', "key", Required = false)]
    public string AzureCosmosKey { get; set; } = null!;

    [Option('p', "purge", Required = false, Default = false)]
    public bool Purge { get; set; }

    [Option('d', "database", Required = false, Default = false)]
    public string? DatabaseName { get; set; }

    public static Task Parse(string[] args, Func<Settings, Task> runImport, Action<IEnumerable<Error>>? abort = null)
    {
        return Parser.Default.ParseArguments<Settings>(args)
            .WithNotParsed(abort ?? (_ => { }))
            .WithParsedAsync(runImport);
    }
}
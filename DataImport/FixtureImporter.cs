namespace DataImport;

public class FixtureImporter : IImporter
{
    private readonly TextWriter _log;

    public FixtureImporter(TextWriter log)
    {
        _log = log;
    }

    public async Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        await _log.WriteLineAsync("TODO: Import fixtures");
    }
}
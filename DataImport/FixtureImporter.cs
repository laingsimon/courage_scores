namespace DataImport;

public class FixtureImporter : IImporter
{
    private readonly TextWriter _log;

    public FixtureImporter(TextWriter log)
    {
        _log = log;
    }

    public Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        return Task.CompletedTask;
    }
}
namespace DataImport;

public class PurgeDataImporter : IImporter
{
    private readonly TextWriter _log;

    public PurgeDataImporter(TextWriter log)
    {
        _log = log;
    }

    public async Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        await PurgeData(destination, token);
    }

    private Task PurgeData(CosmosDatabase destination, CancellationToken token)
    {
        // nothing to do, data is being imported into a different database
        return Task.CompletedTask;
    }
}
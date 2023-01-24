namespace DataImport;

public class PurgeDataImporter : IImporter
{
    public Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        // nothing to do, data is being imported into a different database
        return Task.CompletedTask;
    }
}
namespace DataImport.Importers;

public class PurgeDataImporter : IImporter
{
    public Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext importContext,
        CancellationToken token)
    {
        // nothing to do, data is being imported into a different database
        return Task.FromResult(true);
    }
}
using DataImport.Models;

namespace DataImport.Importers;

public class ScoresImporter : IImporter
{
    public async Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext context, CancellationToken token)
    {
        var scores = await source.GetTable<LegHistory>(TableNames.Scores, token);

        return true;
    }
}
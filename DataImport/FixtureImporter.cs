using DataImport.Models;

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
        var scores = await source.GetTable<LegHistory>(TableNames.Scores, token);
        var players = await source.GetTable<Player>(TableNames.Players, token);
    }
}
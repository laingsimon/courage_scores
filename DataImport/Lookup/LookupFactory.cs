using CourageScores.Models.Cosmos.Team;
using CourageScores.Services;

namespace DataImport.Lookup;

public class LookupFactory
{
    private readonly Guid _divisionId;

    public LookupFactory(Guid divisionId)
    {
        _divisionId = divisionId;
    }

    public async Task<StatefulLookup<string, Team>> GetTeamLookup(CosmosDatabase cosmos, CancellationToken token)
    {
        var table = (await cosmos.GetTables(token).WhereAsync(t => t.Name == "team").ToList()).SingleOrDefault();
        if (table == null)
        {
            return new StatefulLookup<string, Team>(new Dictionary<string, Team>());
        }

        var teams = await cosmos.GetTable<Team>(table, token).WhereAsync(t => t.Deleted == null && t.DivisionId == _divisionId).ToList();
        return new StatefulLookup<string, Team>(teams.ToDictionary(t => t.Name));
    }
}
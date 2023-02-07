using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Services;

namespace DataImport.Lookup;

public class LookupFactory
{
    private readonly TextWriter _log;
    private readonly Settings _settings;

    public LookupFactory(TextWriter log, Settings settings)
    {
        _log = log;
        _settings = settings;
    }

    public async Task<StatefulLookup<string, Team>> GetTeamLookup(CosmosDatabase cosmos, CancellationToken token)
    {
        await _log.WriteLineAsync("Creating team lookup...");

        var table = (await cosmos.GetTables(token).WhereAsync(t => t.Name == "team").ToList()).SingleOrDefault();
        if (table == null)
        {
            return new StatefulLookup<string, Team>();
        }

        var teams = await cosmos.GetTable<Team>(table, token).WhereAsync(t => t.Deleted == null && t.DivisionId == _settings.DivisionId).ToList();
        return new StatefulLookup<string, Team>(teams.ToDictionary(t => t.Name));
    }

    public async Task<StatefulLookup<string, Game>> GetFixtureLookup(CosmosDatabase cosmos, CancellationToken token)
    {
        await _log.WriteLineAsync("Creating fixture lookup...");

        var table = (await cosmos.GetTables(token).WhereAsync(t => t.Name == "game").ToList()).SingleOrDefault();
        if (table == null)
        {
            return new StatefulLookup<string, Game>();
        }

        var fixtures = await cosmos.GetTable<Game>(table, token).WhereAsync(f => f.Deleted == null && f.DivisionId == _settings.DivisionId && f.SeasonId == _settings.SeasonId && f.IsKnockout == false).ToList();
        fixtures = await DeleteAnyFixturesWithADefaultDate(fixtures, cosmos, token).ToList();
        return new StatefulLookup<string, Game>(fixtures.ToDictionary(f => f.Home.Name + "-" + f.Away.Name));
    }

    private async IAsyncEnumerable<Game> DeleteAnyFixturesWithADefaultDate(IEnumerable<Game> fixtures, CosmosDatabase cosmos, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var fixture in fixtures)
        {
            if (fixture.Date == default)
            {
                // delete the fixture
                fixture.Deleted = DateTime.UtcNow;
                fixture.Remover = _settings.UserName;
                await cosmos.UpsertAsync(fixture, "game", token);
                continue;
            }

            yield return fixture;
        }
    }
}
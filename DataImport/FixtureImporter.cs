using CourageScores.Models.Cosmos.Team;
using DataImport.Lookup;
using DataImport.Models;

namespace DataImport;

public class FixtureImporter : IImporter
{
    private readonly TextWriter _log;
    private readonly LookupFactory _lookupFactory;
    private readonly ImportRequest _request;
    private readonly INameComparer _nameComparer;

    public FixtureImporter(TextWriter log, LookupFactory lookupFactory, ImportRequest request, INameComparer nameComparer)
    {
        _log = log;
        _lookupFactory = lookupFactory;
        _request = request;
        _nameComparer = nameComparer;
    }

    public async Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        var players = await source.GetTable<Player>(TableNames.Players, token);
        var context = new ImportContext
        {
            Teams = await _lookupFactory.GetTeamLookup(destination, token),
        };

        await ImportPlayersAndTeams(players.OrderBy(p => p.pubname).ThenBy(p => p.playername), context, token);

        var scores = await source.GetTable<LegHistory>(TableNames.Scores, token);
    }

    private async Task ImportPlayersAndTeams(IEnumerable<Player> players, ImportContext context, CancellationToken token)
    {
        foreach (var player in players)
        {
            if (token.IsCancellationRequested)
            {
                return;
            }

            if (!context.Teams!.TryGetValue(player.pubname!, out var team))
            {
                team = await AddTeam(context.Teams, player);
            }

            var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == _request.SeasonId) ?? await AddSeason(team, context.Teams);
            var teamPlayer = teamSeason.Players.SingleOrDefault(p => _nameComparer.PlayerNameEquals(p.Name, player.playername!, team.Name)) ??
                             await AddPlayer(teamSeason, team, context.Teams, player);
            if (teamPlayer.Name != player.playername)
            {
                teamPlayer.Name = player.playername!;
                context.Teams.SetModified(team);
            }
        }
    }

    private async Task<Team> AddTeam(StatefulLookup<string, Team> teams, Player player)
    {
        var team = _request.Created(new Team
        {
            Id = Guid.NewGuid(),
            Name = player.pubname!,
            DivisionId = _request.DivisionId,
        });
        teams.Add(team.Name, team);
        await _log.WriteLineAsync($"Team created: {team.Name}");
        return team;
    }

    private Task<TeamSeason> AddSeason(Team team, StatefulLookup<string, Team> teams)
    {
        var teamSeason = _request.Created(new TeamSeason
        {
            SeasonId = _request.SeasonId,
            Id = Guid.NewGuid(),
        });
        team.Seasons.Add(teamSeason);
        teams.SetModified(team);
        return Task.FromResult(teamSeason);
    }

    private async Task<TeamPlayer> AddPlayer(TeamSeason teamSeason, Team team, StatefulLookup<string, Team> teams, Player player)
    {
        var teamPlayer = _request.Created(new TeamPlayer
        {
            Id = Guid.NewGuid(),
            Name = player.playername!,
        });
        teamSeason.Players.Add(teamPlayer);
        teams.SetModified(team);
        await _log.WriteLineAsync($"Player {teamPlayer.Name} added to team {team.Name}");
        return teamPlayer;
    }
}
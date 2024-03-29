using CourageScores.Models.Cosmos.Team;
using DataImport.Lookup;
using DataImport.Models;

namespace DataImport.Importers;

public class TeamAndPlayerImporter : IImporter
{
    private readonly TextWriter _log;
    private readonly IImportRequest _request;
    private readonly INameComparer _nameComparer;

    public TeamAndPlayerImporter(TextWriter log, IImportRequest request, INameComparer nameComparer)
    {
        _log = log;
        _request = request;
        _nameComparer = nameComparer;
    }

    public async Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext context, CancellationToken token)
    {
        var players = await source.GetTable<Player>(TableNames.Players, token);

        await ImportPlayersAndTeams(players.OrderBy(p => p.pubname).ThenBy(p => p.playername), context, token);
        var totalSuccess = true;

        foreach (var change in context.Teams!.GetModified())
        {
            if (token.IsCancellationRequested)
            {
                return totalSuccess;
            }

            await _log.WriteLineAsync($"Uploading change: {change.Key}: {change.Value.Id}");
            var result = await destination.UpsertAsync(change.Value, "team", "/id", token);
            if (!result.Success)
            {
                totalSuccess = false;
                await _log.WriteLineAsync($"Failed to upload change: {result.Success}");
            }
        }

        return totalSuccess;
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

            var teamSeason = team.Seasons.NotDeleted().SingleOrDefaultWithError(ts => ts.SeasonId == _request.SeasonId) ?? await AddSeason(team, context.Teams);
            var teamPlayer = teamSeason.Players.NotDeleted().SingleOrDefaultWithError(p => _nameComparer.PlayerNameEquals(p.Name, player.playername!, team.Name)) ??
                             await AddPlayer(teamSeason, team, context.Teams, player);
            if (teamPlayer.Name != player.playername)
            {
                await _log.WriteLineAsync($"Changing player name from {teamPlayer.Name} -> {player.playername}");
                teamPlayer.Name = player.playername!;
                context.Teams.SetModified(team);
            }

            if (player.playcode != null)
            {
                context.PlayerNameLookup[player.playcode] = teamPlayer;
            }
        }
    }

    private async Task<Team> AddTeam(StatefulLookup<string, Team> teams, Player player)
    {
        var team = _request.Created(new Team
        {
            Id = Guid.NewGuid(),
            Name = player.pubname!,
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
            DivisionId = _request.DivisionId,
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
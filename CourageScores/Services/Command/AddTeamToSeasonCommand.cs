using CourageScores.Models.Cosmos;

namespace CourageScores.Services.Command;

public class AddTeamToSeasonCommand : IUpdateCommand<Season, Season>
{
    private Models.Cosmos.Team.Team? _team;

    public AddTeamToSeasonCommand AddTeam(Models.Cosmos.Team.Team team)
    {
        _team = team;
        return this;
    }

    public Task<CommandOutcome<Season>> ApplyUpdate(Season team, CancellationToken token)
    {
        if (_team == null)
        {
            throw new InvalidOperationException($"Team hasn't been set, ensure {nameof(AddTeam)} is called");
        }

        if (team.Teams.Any(t => t.Id == _team.Id))
        {
            return Task.FromResult(new CommandOutcome<Season>(true, $"Team already attributed to the {team.Name}", null));
        }

        team.Teams.Add(_team);
        return Task.FromResult(new CommandOutcome<Season>(true, "Team added to season", team));
    }
}
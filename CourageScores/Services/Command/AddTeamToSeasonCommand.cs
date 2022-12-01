namespace CourageScores.Services.Command;

public class AddTeamToSeasonCommand : IUpdateCommand<Models.Cosmos.Season, Models.Cosmos.Season>
{
    private Models.Cosmos.Team.Team? _team;

    public AddTeamToSeasonCommand AddTeam(Models.Cosmos.Team.Team team)
    {
        _team = team;
        return this;
    }

    public Task<CommandOutcome<Models.Cosmos.Season>> ApplyUpdate(Models.Cosmos.Season model, CancellationToken token)
    {
        if (_team == null)
        {
            throw new InvalidOperationException($"Team hasn't been set, ensure {nameof(AddTeam)} is called");
        }

        if (model.Deleted != null)
        {
            return Task.FromResult(new CommandOutcome<Models.Cosmos.Season>(false, "Cannot edit a season that has been deleted", null));
        }

        if (model.Teams.Any(t => t.Id == _team.Id))
        {
            return Task.FromResult(new CommandOutcome<Models.Cosmos.Season>(true, $"Team already attributed to the {model.Name}", null));
        }

        model.Teams.Add(_team);
        return Task.FromResult(new CommandOutcome<Models.Cosmos.Season>(true, "Team added to season", model));
    }
}
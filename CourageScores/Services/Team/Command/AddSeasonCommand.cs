using CourageScores.Models.Cosmos.Team;

namespace CourageScores.Services.Team.Command;

public class AddSeasonCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamSeason>
{
    private readonly IAuditingHelper _auditingHelper;
    private Guid? _seasonId;

    public AddSeasonCommand(IAuditingHelper auditingHelper)
    {
        _auditingHelper = auditingHelper;
    }

    public AddSeasonCommand ForSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public Task<CommandOutcome<TeamSeason>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(ForSeason)} is called");
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == _seasonId);
        if (teamSeason != null)
        {
            return Task.FromResult(new CommandOutcome<TeamSeason>(true, "Season already exists", teamSeason));
        }

        // add the season to the team
        teamSeason = new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _seasonId.Value,
            Players = new List<TeamPlayer>(),
        };
        _auditingHelper.SetUpdated(teamSeason);
        model.Seasons.Add(teamSeason);

        return Task.FromResult(new CommandOutcome<TeamSeason>(true, "Season added to this team", teamSeason));
    }
}
using CourageScores.Models.Cosmos.Team;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddSeasonToTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamSeason>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISeasonService _seasonService;
    private Guid? _seasonId;
    private Guid? _copyPlayersFromOtherSeasonId;
    private bool _skipSeasonExistenceCheck;

    public AddSeasonToTeamCommand(
        IAuditingHelper auditingHelper,
        ISeasonService seasonService)
    {
        _auditingHelper = auditingHelper;
        _seasonService = seasonService;
    }

    public virtual AddSeasonToTeamCommand ForSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public virtual AddSeasonToTeamCommand CopyPlayersFromSeasonId(Guid seasonId)
    {
        _copyPlayersFromOtherSeasonId = seasonId;
        return this;
    }

    public virtual AddSeasonToTeamCommand SkipSeasonExistenceCheck()
    {
        _skipSeasonExistenceCheck = true;
        return this;
    }

    public virtual async Task<CommandOutcome<TeamSeason>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(ForSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new CommandOutcome<TeamSeason>(false, "Cannot edit a team that has been deleted", null);
        }

        if (_skipSeasonExistenceCheck == false && await _seasonService.Get(_seasonId.Value, token) == null)
        {
            return new CommandOutcome<TeamSeason>(false, "Season not found", null);
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == _seasonId);
        if (teamSeason != null)
        {
            if (_copyPlayersFromOtherSeasonId.HasValue && teamSeason.Players.Count == 0)
            {
                teamSeason.Players = GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value);
                return new CommandOutcome<TeamSeason>(true, $"Season already exists, {teamSeason.Players.Count} players copied", teamSeason);
            }

            return new CommandOutcome<TeamSeason>(true, "Season already exists", teamSeason);
        }

        // add the season to the team
        teamSeason = new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _seasonId.Value,
            Players = _copyPlayersFromOtherSeasonId.HasValue
                ? GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value)
                : new List<TeamPlayer>(),
        };
        await _auditingHelper.SetUpdated(teamSeason, token);
        model.Seasons.Add(teamSeason);

        return new CommandOutcome<TeamSeason>(
            true,
            _copyPlayersFromOtherSeasonId.HasValue
                ? $"Season added to the {model.Name} team, {teamSeason.Players.Count} players copied"
                : $"Season added to the {model.Name} team",
            teamSeason);
    }

    private static List<TeamPlayer> GetPlayersFromOtherSeason(Models.Cosmos.Team.Team team, Guid seasonId)
    {
        var teamSeason = team.Seasons.SingleOrDefault(s => s.SeasonId == seasonId);
        return teamSeason == null
            ? new List<TeamPlayer>()
            : teamSeason.Players;
    }
}
using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddSeasonToTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamSeason>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISeasonService _seasonService;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private Guid? _seasonId;
    private Guid? _copyPlayersFromOtherSeasonId;
    private bool _skipSeasonExistenceCheck;

    public AddSeasonToTeamCommand(
        IAuditingHelper auditingHelper,
        ISeasonService seasonService,
        ScopedCacheManagementFlags cacheFlags)
    {
        _auditingHelper = auditingHelper;
        _seasonService = seasonService;
        _cacheFlags = cacheFlags;
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

    public virtual async Task<ActionResult<TeamSeason>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(ForSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new ActionResult<TeamSeason>
            {
                Success = false,
                Messages = "Cannot edit a team that has been deleted",
            };
        }

        if (_skipSeasonExistenceCheck == false && await _seasonService.Get(_seasonId.Value, token) == null)
        {
            return new ActionResult<TeamSeason>
            {
                Success = false,
                Messages = "Season not found",
            };
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == _seasonId);
        if (teamSeason != null)
        {
            if (_copyPlayersFromOtherSeasonId.HasValue && teamSeason.Players.Count == 0)
            {
                teamSeason.Players = GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value);
                _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId;
                await _auditingHelper.SetUpdated(teamSeason, token);
                return new ActionResult<TeamSeason>
                {
                    Success = true,
                    Messages = $"Season already exists, {teamSeason.Players.Count} players copied",
                    Result = teamSeason,
                };
            }

            await _auditingHelper.SetUpdated(teamSeason, token); // undelete the season
            return new ActionResult<TeamSeason>
            {
                Success = true,
                Messages = "Season already exists",
                Result = teamSeason,
            };
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
        _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId;

        return new ActionResult<TeamSeason>
        {
            Success = true,
            Messages = _copyPlayersFromOtherSeasonId.HasValue
                ? $"Season added to the {model.Name} team, {teamSeason.Players.Count} players copied"
                : $"Season added to the {model.Name} team",
            Result = teamSeason,
        };
    }

    private static List<TeamPlayer> GetPlayersFromOtherSeason(Models.Cosmos.Team.Team team, Guid seasonId)
    {
        var teamSeason = team.Seasons.SingleOrDefault(s => s.SeasonId == seasonId);
        return teamSeason == null
            ? new List<TeamPlayer>()
            : teamSeason.Players;
    }
}
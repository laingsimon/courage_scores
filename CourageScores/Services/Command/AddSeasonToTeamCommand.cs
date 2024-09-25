using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddSeasonToTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamSeason>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly ICachingSeasonService _seasonService;
    private Guid? _copyPlayersFromOtherSeasonId;
    private Guid? _divisionId;
    private Guid? _seasonId;
    private bool _skipSeasonExistenceCheck;

    public AddSeasonToTeamCommand(
        IAuditingHelper auditingHelper,
        ICachingSeasonService seasonService,
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

    public virtual AddSeasonToTeamCommand ForDivision(Guid divisionId)
    {
        _divisionId = divisionId;
        return this;
    }

    public virtual AddSeasonToTeamCommand CopyPlayersFromSeasonId(Guid? seasonId)
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
        _seasonId.ThrowIfNull($"SeasonId hasn't been set, ensure {nameof(ForSeason)} is called");
        _divisionId.ThrowIfNull($"DivisionId hasn't been set, ensure {nameof(ForDivision)} is called");

        if (model.Deleted != null)
        {
            return new ActionResult<TeamSeason>
            {
                Success = false,
                Errors =
                {
                    "Cannot edit a team that has been deleted",
                },
            };
        }

        if (_skipSeasonExistenceCheck == false && await _seasonService.Get(_seasonId!.Value, token) == null)
        {
            return new ActionResult<TeamSeason>
            {
                Success = false,
                Errors =
                {
                    "Season not found",
                },
            };
        }

        var teamSeason = model.Seasons.SingleOrDefault(ts => ts.SeasonId == _seasonId); // allow deleted seasons to be found, so they can be restored
        if (teamSeason != null)
        {
            teamSeason.DivisionId = _divisionId!.Value;

            if (_copyPlayersFromOtherSeasonId.HasValue && teamSeason.Players.All(p => p.Deleted != null)) // there are no non-deleted players
            {
                teamSeason.Players = GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value);
                _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId;
                _cacheFlags.EvictDivisionDataCacheForDivisionId = _divisionId;
                await _auditingHelper.SetUpdated(teamSeason, token);
                return new ActionResult<TeamSeason>
                {
                    Success = true,
                    Messages =
                    {
                        $"Season already exists, {teamSeason.Players.Count} players copied",
                    },
                    Result = teamSeason,
                };
            }

            await _auditingHelper.SetUpdated(teamSeason, token); // undelete the season
            return new ActionResult<TeamSeason>
            {
                Success = true,
                Messages =
                {
                    "Season already exists",
                },
                Result = teamSeason,
            };
        }

        // add the season to the team
        teamSeason = new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _seasonId!.Value,
            DivisionId = _divisionId!.Value,
            Players = _copyPlayersFromOtherSeasonId.HasValue
                ? GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value)
                : new List<TeamPlayer>(),
        };
        await _auditingHelper.SetUpdated(teamSeason, token);
        model.Seasons.Add(teamSeason);
        _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = _divisionId;

        return new ActionResult<TeamSeason>
        {
            Success = true,
            Messages =
            {
                _copyPlayersFromOtherSeasonId.HasValue
                    ? $"Season added to the {model.Name} team, {teamSeason.Players.Count} players copied"
                    : $"Season added to the {model.Name} team",
            },
            Result = teamSeason,
        };
    }

    private static List<TeamPlayer> GetPlayersFromOtherSeason(Models.Cosmos.Team.Team team, Guid seasonId)
    {
        var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == seasonId && ts.Deleted == null);
        return teamSeason == null
            ? new List<TeamPlayer>()
            : teamSeason.Players.Where(p => p.Deleted == null).ToList();
    }
}
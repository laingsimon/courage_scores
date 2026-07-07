using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Services.Command;

public class DeleteTeamCommand : IUpdateCommand<CosmosTeam, CosmosTeam>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IAccessService _accessService;
    private readonly IUserService _userService;
    private bool _deleteIfNoSeasonsAssigned;
    private Guid? _seasonId;

    public DeleteTeamCommand(IUserService userService, IAuditingHelper auditingHelper, ScopedCacheManagementFlags cacheFlags, IAccessService accessService)
    {
        _userService = userService;
        _auditingHelper = auditingHelper;
        _cacheFlags = cacheFlags;
        _accessService = accessService;
    }

    public async Task<ActionResult<CosmosTeam>> ApplyUpdate(CosmosTeam model, CancellationToken token)
    {
        _seasonId.ThrowIfNull($"SeasonId hasn't been set, ensure {nameof(FromSeason)} is called");

        if (model.Deleted != null)
        {
            return new ActionResult<CosmosTeam>
            {
                Success = true,
                Errors =
                {
                    "Team has already been deleted",
                },
                Result = model,
            };
        }

        var user = await _userService.GetUser(token);

        if (!await _accessService.HasAccess(user, AccessOption.ManageTeams, UserAccessContext.None(), token))
        {
            return new ActionResult<CosmosTeam>
            {
                Success = false,
                Errors =
                {
                    "Not permitted",
                },
                Result = model,
            };
        }

        var matchingSeasons = model.Seasons.Where(ts => ts.SeasonId == _seasonId!.Value && ts.Deleted == null).ToList();
        var deletedTeamSeasons = new List<TeamSeason>();
        foreach (var matchingSeason in matchingSeasons)
        {
            var teamSeasonContext = UserAccessContext.ForTeam(_seasonId!.Value, matchingSeason.DivisionId, model.Id);
            if (await _accessService.HasAccess(user, AccessOption.ManageTeams, teamSeasonContext, token))
            {
                await _auditingHelper.SetDeleted(matchingSeason, token);
                deletedTeamSeasons.Add(matchingSeason);
            }
        }

        if (model.Seasons.Any(ts => ts.Deleted == null))
        {
            if (matchingSeasons.Count == 0)
            {
                return new ActionResult<CosmosTeam>
                {
                    Success = false,
                    Warnings =
                    {
                        "Team allocated to other season/s",
                    },
                    Result = model,
                };
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId!.Value;
            return new ActionResult<CosmosTeam>
            {
                Success = true,
                Messages =
                {
                    $"Removed team from {deletedTeamSeasons.Count} season/s",
                },
                Result = model,
            };
        }

        if (await _accessService.HasAccess(user, AccessOption.ManageTeams, UserAccessContext.ForSeason(_seasonId!.Value), token) && _deleteIfNoSeasonsAssigned)
        {
            if (deletedTeamSeasons.Count == 0)
            {
                _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId!.Value;
                return new ActionResult<CosmosTeam>
                {
                    Success = true,
                    Messages =
                    {
                        "Team deleted",
                    },
                    Result = model,
                    Delete = true,
                };
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId!.Value;
            return new ActionResult<CosmosTeam>
            {
                Success = true,
                Messages =
                {
                    $"Removed team from {deletedTeamSeasons.Count} season/s, and team deleted",
                },
                Result = model,
                Delete = true,
            };
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId!.Value;

        return new ActionResult<CosmosTeam>
        {
            Success = !_deleteIfNoSeasonsAssigned || deletedTeamSeasons.Any(),
            Messages =
            {
                _deleteIfNoSeasonsAssigned
                    ? $"Removed team from {deletedTeamSeasons.Count} season/s, not permitted to delete the team entirely"
                    : $"Removed team from {deletedTeamSeasons.Count} season/s",
            },
            Result = model,
        };
    }

    public DeleteTeamCommand FromSeason(Guid? seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public DeleteTeamCommand DeleteIfNoSeasonsAssigned()
    {
        _deleteIfNoSeasonsAssigned = true;
        return this;
    }
}

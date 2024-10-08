using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class DeleteTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, Models.Cosmos.Team.Team>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IUserService _userService;
    private bool _deleteIfNoSeasonsAssigned;
    private Guid? _seasonId;

    public DeleteTeamCommand(IUserService userService, IAuditingHelper auditingHelper, ScopedCacheManagementFlags cacheFlags)
    {
        _userService = userService;
        _auditingHelper = auditingHelper;
        _cacheFlags = cacheFlags;
    }

    public async Task<ActionResult<Models.Cosmos.Team.Team>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        _seasonId.ThrowIfNull($"SeasonId hasn't been set, ensure {nameof(FromSeason)} is called");

        if (model.Deleted != null)
        {
            return new ActionResult<Models.Cosmos.Team.Team>
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

        if (user?.Access?.ManageTeams != true)
        {
            return new ActionResult<Models.Cosmos.Team.Team>
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
        foreach (var matchingSeason in matchingSeasons)
        {
            await _auditingHelper.SetDeleted(matchingSeason, token);
        }

        if (model.Seasons.Any(ts => ts.Deleted == null))
        {
            if (!matchingSeasons.Any())
            {
                return new ActionResult<Models.Cosmos.Team.Team>
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
            return new ActionResult<Models.Cosmos.Team.Team>
            {
                Success = true,
                Messages =
                {
                    $"Removed team from {matchingSeasons.Count} season/s",
                },
                Result = model,
            };
        }

        if (model.CanDelete(user) && _deleteIfNoSeasonsAssigned)
        {
            if (!matchingSeasons.Any())
            {
                _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId!.Value;
                return new ActionResult<Models.Cosmos.Team.Team>
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
            return new ActionResult<Models.Cosmos.Team.Team>
            {
                Success = true,
                Messages =
                {
                    $"Removed team from {matchingSeasons.Count} season/s, and team deleted",
                },
                Result = model,
                Delete = true,
            };
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId!.Value;

        return new ActionResult<Models.Cosmos.Team.Team>
        {
            Success = !_deleteIfNoSeasonsAssigned || matchingSeasons.Any(),
            Messages =
            {
                _deleteIfNoSeasonsAssigned
                    ? $"Removed team from {matchingSeasons.Count} season/s, not permitted to delete the team entirely"
                    : $"Removed team from {matchingSeasons.Count} season/s",
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
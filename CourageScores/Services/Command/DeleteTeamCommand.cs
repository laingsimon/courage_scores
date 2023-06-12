using CourageScores.Filters;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class DeleteTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, Models.Cosmos.Team.Team>
{
    private readonly IUserService _userService;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private Guid? _seasonId;
    private bool _deleteIfNoSeasonsAssigned;

    public DeleteTeamCommand(IUserService userService, IAuditingHelper auditingHelper, ScopedCacheManagementFlags cacheFlags)
    {
        _userService = userService;
        _auditingHelper = auditingHelper;
        _cacheFlags = cacheFlags;
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

    public async Task<CommandResult<Models.Cosmos.Team.Team>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(FromSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new CommandResult<Models.Cosmos.Team.Team>
            {
                Success = true,
                Message = "Team has already been deleted",
                Result = model,
            };
        }

        var user = await _userService.GetUser(token);

        if (user?.Access?.ManageTeams != true)
        {
            return new CommandResult<Models.Cosmos.Team.Team>
            {
                Success = false,
                Message = "Not permitted",
                Result = model,
            };
        }

        var matchingSeasons = model.Seasons.Where(s => s.SeasonId == _seasonId.Value && s.Deleted == null).ToList();
        foreach (var matchingSeason in matchingSeasons)
        {
            await _auditingHelper.SetDeleted(matchingSeason, token);
        }

        if (model.Seasons.Any(ts => ts.Deleted == null))
        {
            if (!matchingSeasons.Any())
            {
                return new CommandResult<Models.Cosmos.Team.Team>
                {
                    Success = false,
                    Message = "Team allocated to other season/s",
                    Result = model,
                };
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
            return new CommandResult<Models.Cosmos.Team.Team>
            {
                Success = true,
                Message = $"Removed team from {matchingSeasons.Count} season/s",
                Result = model,
            };
        }

        if (model.CanDelete(user) && _deleteIfNoSeasonsAssigned)
        {
            if (!matchingSeasons.Any())
            {
                _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
                return new CommandResult<Models.Cosmos.Team.Team>
                {
                    Success = true,
                    Message = "Team deleted",
                    Result = model,
                    Delete = true
                };
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
            return new CommandResult<Models.Cosmos.Team.Team>
            {
                Success = true,
                Message = $"Removed team from {matchingSeasons.Count} season/s, and team deleted",
                Result = model,
                Delete = true
            };
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;

        return new CommandResult<Models.Cosmos.Team.Team>
        {
            Success = !_deleteIfNoSeasonsAssigned || matchingSeasons.Any(),
            Message = _deleteIfNoSeasonsAssigned
                ? $"Removed team from {matchingSeasons.Count} season/s, not permitted to delete the team entirely"
                : $"Removed team from {matchingSeasons.Count} season/s",
            Result = model,
        };
    }
}
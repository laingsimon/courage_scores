using CourageScores.Filters;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class DeleteTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, Models.Cosmos.Team.Team>
{
    private readonly IUserService _userService;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private Guid? _seasonId;

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

    public async Task<CommandOutcome<Models.Cosmos.Team.Team>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(FromSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new CommandOutcome<Models.Cosmos.Team.Team>(true, "Team has already been deleted", model);
        }

        var user = await _userService.GetUser(token);

        if (user?.Access?.ManageTeams != true)
        {
            return new CommandOutcome<Models.Cosmos.Team.Team>(false, "Not permitted", model);
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
                return new CommandOutcome<Models.Cosmos.Team.Team>(false, "Team allocated to other season/s", model);
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
            return new CommandOutcome<Models.Cosmos.Team.Team>(true, $"Removed team from {matchingSeasons.Count} season/s", model);
        }

        if (model.CanDelete(user))
        {
            if (!matchingSeasons.Any())
            {
                _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
                return new CommandOutcome<Models.Cosmos.Team.Team>(true, "Team deleted", model)
                {
                    Delete = true
                };
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
            return new CommandOutcome<Models.Cosmos.Team.Team>(true, $"Removed team from {matchingSeasons.Count} season/s, and team deleted", model)
            {
                Delete = true
            };
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = _seasonId.Value;
        return new CommandOutcome<Models.Cosmos.Team.Team>(matchingSeasons.Any(), $"Removed team from {matchingSeasons.Count} season/s, not permitted to delete the team entirely", model);
    }
}
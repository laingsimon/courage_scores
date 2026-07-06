using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class RemovePlayerCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly IAccessService _accessService;
    private readonly ICachingSeasonService _seasonService;
    private readonly IUserService _userService;
    private Guid? _playerId;
    private Guid? _seasonId;

    public RemovePlayerCommand(
        ICachingSeasonService seasonService,
        IUserService userService,
        IAuditingHelper auditingHelper,
        IAccessService accessService)
    {
        _seasonService = seasonService;
        _userService = userService;
        _auditingHelper = auditingHelper;
        _accessService = accessService;
    }

    public RemovePlayerCommand ForPlayer(Guid playerId)
    {
        _playerId = playerId;
        return this;
    }

    public RemovePlayerCommand FromSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public async Task<ActionResult<TeamPlayer>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        _playerId.ThrowIfNull($"PlayerId hasn't been set, ensure {nameof(ForPlayer)} is called");
        _seasonId.ThrowIfNull($"SeasonId hasn't been set, ensure {nameof(FromSeason)} is called");

        if (model.Deleted != null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Errors =
                {
                    "Cannot edit a team that has been deleted",
                },
            };
        }

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Errors =
                {
                    "Player cannot be removed, not logged in",
                },
            };
        }

        var context = UserAccessContext.NotImplemented(/*_seasonId!.Value, divisionId, model.Id*/ "divisionId is not accessible");
        var canManageTeams = await _accessService.HasAccess(user, AccessOption.ManageTeams, context, token);
        var canInputResultsForTeam = await _accessService.HasAccess(user, AccessOption.InputResults, context, token) && user.TeamId == model.Id;
        if (!canManageTeams && !canInputResultsForTeam)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Errors =
                {
                    "Player cannot be removed, not permitted",
                },
            };
        }

        var season = await _seasonService.Get(_seasonId!.Value, token);
        if (season == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Errors =
                {
                    "Season could not be found",
                },
            };
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == season.Id && s.Deleted == null);
        if (teamSeason == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Warnings =
                {
                    $"Team is not registered to the {season.Name} season",
                },
            };
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId); // allow player to be 're-deleted'
        if (player == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Warnings =
                {
                    $"Player does not have a player with this id for the {season.Name} season",
                },
            };
        }


        await _auditingHelper.SetDeleted(player, token);
        return new ActionResult<TeamPlayer>
        {
            Success = true,
            Messages =
            {
                $"Player {player.Name} removed from the {season.Name} season",
            },
            Result = player,
        };
    }
}

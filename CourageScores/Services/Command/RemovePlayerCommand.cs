using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class RemovePlayerCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly ISeasonService _seasonService;
    private readonly IUserService _userService;
    private readonly IAuditingHelper _auditingHelper;
    private Guid? _playerId;
    private Guid? _seasonId;

    public RemovePlayerCommand(
        ISeasonService seasonService,
        IUserService userService,
        IAuditingHelper auditingHelper)
    {
        _seasonService = seasonService;
        _userService = userService;
        _auditingHelper = auditingHelper;
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
        if (_playerId == null)
        {
            throw new InvalidOperationException($"PlayerId hasn't been set, ensure {nameof(ForPlayer)} is called");
        }

        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(FromSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = "Cannot edit a team that has been deleted",
            };
        }

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = "Player cannot be removed, not logged in",
            };
        }

        if (!(user.Access?.ManageTeams == true || (user.Access?.InputResults == true && user.TeamId == model.Id)))
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = "Player cannot be removed, not permitted",
            };
        }

        var season = await _seasonService.Get(_seasonId.Value, token);
        if (season == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = "Season could not be found",
            };
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == season.Id);
        if (teamSeason == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = $"Team is not registered to the {season.Name} season",
            };
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId);
        if (player == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = $"Player does not have a player with this id for the {season.Name} season",
            };
        }


        await _auditingHelper.SetDeleted(player, token);
        return new ActionResult<TeamPlayer>
        {
            Success = true,
            Messages = $"Player {player.Name} removed from the {season.Name} season",
            Result = player,
        };
    }
}
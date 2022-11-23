using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class RemovePlayerCommand : IUpdateCommand<Team, TeamPlayer>
{
    private readonly IGenericRepository<Season> _seasonRepository;
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;
    private Guid? _playerId;
    private Guid? _seasonId;

    public RemovePlayerCommand(
        IGenericRepository<Season> seasonRepository,
        ISystemClock clock,
        IUserService userService)
    {
        _seasonRepository = seasonRepository;
        _clock = clock;
        _userService = userService;
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

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Team model, CancellationToken token)
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
            return new CommandOutcome<TeamPlayer>(false, "Cannot edit a team that has been deleted", null);
        }

        var user = await _userService.GetUser();
        if (user == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Player cannot be removed, not logged in", null);
        }

        var season = await _seasonRepository.Get(_seasonId.Value, token);
        if (season == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Season could not be found", null);
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == season.Id);
        if (teamSeason == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Team is not registered to the ${season.Name} season", null);
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId);
        if (player == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Player does not have a player with this id for the {season.Name} season", null);
        }

        player.Deleted = _clock.UtcNow.UtcDateTime;
        player.Remover = user.Name;
        return new CommandOutcome<TeamPlayer>(true, $"Player {player.Name} removed from the {season.Name} season", player);
    }
}
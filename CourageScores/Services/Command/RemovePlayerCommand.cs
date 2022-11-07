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

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Team model, CancellationToken token)
    {
        if (_playerId == null)
        {
            throw new InvalidOperationException($"Player hasn't been set, ensure {nameof(ForPlayer)} is called");
        }

        var user = await _userService.GetUser();
        if (user == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Player cannot be removed, not logged in", null);
        }

        var seasons = await _seasonRepository.GetAll(token).ToList();
        var currentSeason = seasons.MaxBy(s => s.StartDate);
        if (currentSeason == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Player cannot be removed as no season exists", null);
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == currentSeason.Id);
        if (teamSeason == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Team is not registered to the current season", null);
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId);
        if (player == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Player does not have a player with this id for the {currentSeason.Name} season", null);
        }

        player.Deleted = _clock.UtcNow.UtcDateTime;
        player.Remover = user.Name;
        return new CommandOutcome<TeamPlayer>(true, $"Player {player.Name} removed from the {currentSeason.Name} season", player);
    }
}
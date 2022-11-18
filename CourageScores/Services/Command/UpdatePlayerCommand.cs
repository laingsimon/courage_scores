using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class UpdatePlayerCommand : IUpdateCommand<Team, TeamPlayer>
{
    private readonly IUserService _userService;
    private readonly IGenericRepository<Season> _seasonRepository;
    private readonly ISystemClock _clock;
    private Guid? _playerId;
    private EditTeamPlayerDto? _player;

    public UpdatePlayerCommand(IUserService userService, IGenericRepository<Season> seasonRepository, ISystemClock clock)
    {
        _userService = userService;
        _seasonRepository = seasonRepository;
        _clock = clock;
    }

    public UpdatePlayerCommand ForPlayer(Guid playerId)
    {
        _playerId = playerId;
        return this;
    }

    public UpdatePlayerCommand WithData(EditTeamPlayerDto player)
    {
        _player = player;
        return this;
    }

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Team model, CancellationToken token)
    {
        if (_playerId == null)
        {
            throw new InvalidOperationException($"PlayerId hasn't been set, ensure {nameof(ForPlayer)} is called");
        }

        if (_player == null)
        {
            throw new InvalidOperationException($"Player hasn't been set, ensure {nameof(WithData)} is called");
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

        player.Name = _player.Name;
        player.Captain = _player.Captain;
        player.Updated = _clock.UtcNow.UtcDateTime;
        player.Editor = user.Name;
        return new CommandOutcome<TeamPlayer>(true, $"Player {player.Name} updated in the {currentSeason.Name} season", player);
    }
}
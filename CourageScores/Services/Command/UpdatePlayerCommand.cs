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
    private Guid? _seasonId;

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

    public UpdatePlayerCommand InSeason(Guid seasonId)
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

        if (_player == null)
        {
            throw new InvalidOperationException($"Player hasn't been set, ensure {nameof(WithData)} is called");
        }

        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(InSeason)} is called");
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
            return new CommandOutcome<TeamPlayer>(false, $"Team ${model.Name} is not registered to the ${season.Name} season", null);
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId);
        if (player == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Player does not have a player with this id for the {season.Name} season", null);
        }

        player.Name = _player.Name;
        player.Captain = _player.Captain;
        player.Updated = _clock.UtcNow.UtcDateTime;
        player.Editor = user.Name;
        return new CommandOutcome<TeamPlayer>(true, $"Player {player.Name} updated in the {season.Name} season", player);
    }
}
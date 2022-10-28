using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class AddPlayerToTeamSeasonCommand : IUpdateCommand<Team, TeamPlayer>
{
    private readonly IGenericRepository<Season> _seasonRepository;
    private readonly ICommandFactory _commandFactory;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;
    private EditTeamPlayerDto? _player;

    public AddPlayerToTeamSeasonCommand(
        IGenericRepository<Season> seasonRepository,
        ICommandFactory commandFactory,
        IAuditingHelper auditingHelper,
        ISystemClock clock,
        IUserService userService)
    {
        _seasonRepository = seasonRepository;
        _commandFactory = commandFactory;
        _auditingHelper = auditingHelper;
        _clock = clock;
        _userService = userService;
    }

    public AddPlayerToTeamSeasonCommand ForPlayer(EditTeamPlayerDto player)
    {
        _player = player;
        return this;
    }

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Team model, CancellationToken token)
    {
        if (_player == null)
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
            return new CommandOutcome<TeamPlayer>(false, "A season must exist before a player can be added", null);
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == currentSeason.Id);
        if (teamSeason == null)
        {
            var addSeasonCommand = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(currentSeason.Id);
            var result = await addSeasonCommand.ApplyUpdate(model, token);
            if (!result.Success || result.Result == null)
            {
                return new CommandOutcome<TeamPlayer>(false, "Could not add season to team", null);
            }

            teamSeason = result.Result;
        }

        var players = teamSeason.Players;

        var existingPlayer = players.SingleOrDefault(p => p.Name == _player.Name);
        if (existingPlayer != null)
        {
            if (existingPlayer.Deleted == null)
            {
                return new CommandOutcome<TeamPlayer>(true, "Player already exists with this name, player not added", existingPlayer);
            }

            existingPlayer.Deleted = null;
            existingPlayer.Remover = null;
            existingPlayer.Updated = _clock.UtcNow.UtcDateTime;
            existingPlayer.Editor = user.Name;
            existingPlayer.Captain = _player.Captain;
            return new CommandOutcome<TeamPlayer>(true, "Player undeleted from team", existingPlayer);
        }

        var newPlayer = new TeamPlayer
        {
            Name = _player.Name,
            Captain = _player.Captain,
            Id = Guid.NewGuid(),
        };
        await _auditingHelper.SetUpdated(newPlayer);
        players.Add(newPlayer);

        return new CommandOutcome<TeamPlayer>(true, $"Player added to team for the {currentSeason.Name} season", newPlayer);
    }
}
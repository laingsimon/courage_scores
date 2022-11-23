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
    private Guid? _seasonId;

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

    public AddPlayerToTeamSeasonCommand ToSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Team model, CancellationToken token)
    {
        if (_player == null)
        {
            throw new InvalidOperationException($"Player hasn't been set, ensure {nameof(ForPlayer)} is called");
        }

        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(ToSeason)} is called");
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
            var addSeasonCommand = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(season.Id);
            var result = await addSeasonCommand.ApplyUpdate(model, token);
            if (!result.Success || result.Result == null)
            {
                return new CommandOutcome<TeamPlayer>(false, $"Could not add the ${season.Name} season to team ${model.Name} - ${result.Message}", null);
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

        return new CommandOutcome<TeamPlayer>(true, $"Player added to the ${model.Name} team for the {season.Name} season", newPlayer);
    }
}
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class AddPlayerToTeamSeasonCommand : IUpdateCommand<Team, TeamPlayer>
{
    private readonly ISeasonService _seasonService;
    private readonly ICommandFactory _commandFactory;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;
    private EditTeamPlayerDto? _player;
    private Guid? _seasonId;

    public AddPlayerToTeamSeasonCommand(
        ISeasonService seasonService,
        ICommandFactory commandFactory,
        IAuditingHelper auditingHelper,
        ISystemClock clock,
        IUserService userService)
    {
        _seasonService = seasonService;
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

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Player cannot be added, not logged in", null);
        }

        if (!(user.Access?.ManageTeams == true || (user.Access?.InputResults == true && user.TeamId == model.Id)))
        {
            return new CommandOutcome<TeamPlayer>(false, "Player cannot be added, not permitted", null);
        }

        var season = await _seasonService.Get(_seasonId.Value, token);
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
                return new CommandOutcome<TeamPlayer>(false, $"Could not add the {season.Name} season to team {model.Name} - {result.Message}", null);
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

            await _auditingHelper.SetUpdated(existingPlayer, token);
            existingPlayer.Captain = _player.Captain;
            existingPlayer.EmailAddress = _player.EmailAddress ?? existingPlayer.EmailAddress;
            return new CommandOutcome<TeamPlayer>(true, "Player undeleted from team", existingPlayer);
        }

        var newPlayer = new TeamPlayer
        {
            Name = _player.Name,
            Captain = _player.Captain,
            EmailAddress = _player.EmailAddress,
            Id = Guid.NewGuid(),
        };
        await _auditingHelper.SetUpdated(newPlayer, token);
        players.Add(newPlayer);

        return new CommandOutcome<TeamPlayer>(true, $"Player added to the {model.Name} team for the {season.Name} season", newPlayer);
    }
}
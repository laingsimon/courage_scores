using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddPlayerToTeamSeasonCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly ISeasonService _seasonService;
    private readonly ICommandFactory _commandFactory;
    private readonly IAuditingHelper _auditingHelper;
    private readonly IUserService _userService;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private EditTeamPlayerDto? _player;
    private Guid? _seasonId;
    private bool _addSeasonToTeamIfMissing = true;

    public AddPlayerToTeamSeasonCommand(
        ISeasonService seasonService,
        ICommandFactory commandFactory,
        IAuditingHelper auditingHelper,
        IUserService userService,
        ScopedCacheManagementFlags cacheFlags)
    {
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _auditingHelper = auditingHelper;
        _userService = userService;
        _cacheFlags = cacheFlags;
    }

    public virtual AddPlayerToTeamSeasonCommand ForPlayer(EditTeamPlayerDto player)
    {
        _player = player;
        return this;
    }

    public virtual AddPlayerToTeamSeasonCommand ToSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public virtual AddPlayerToTeamSeasonCommand AddSeasonToTeamIfMissing(bool allowed)
    {
        _addSeasonToTeamIfMissing = allowed;
        return this;
    }

    public virtual async Task<ActionResult<TeamPlayer>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
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
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = { "Cannot edit a team that has been deleted" },
            };
        }

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Messages = { "Player cannot be added, not logged in" },
                Success = false,
            };
        }

        if (!(user.Access?.ManageTeams == true || (user.Access?.InputResults == true && user.TeamId == model.Id)))
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = { "Player cannot be added, not permitted" },
            };
        }

        var season = await _seasonService.Get(_seasonId.Value, token);
        if (season == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Messages = { "Season could not be found" },
            };
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == season.Id);
        if (teamSeason == null)
        {
            if (!_addSeasonToTeamIfMissing)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = false,
                    Messages = { $"{season.Name} season is not attributed to team {model.Name}" },
                };
            }

            var addSeasonCommand = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(season.Id);
            var result = await addSeasonCommand.ApplyUpdate(model, token);
            if (!result.Success || result.Result == null)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = false,
                    Warnings = { $"Could not add the {season.Name} season to team {model.Name}" },
                    Messages = result.Messages,
                };
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
            teamSeason = result.Result;
        }

        var players = teamSeason.Players;

        var existingPlayer = players.SingleOrDefault(p => p.Name == _player.Name);
        if (existingPlayer != null)
        {
            if (existingPlayer.Deleted == null)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = true,
                    Messages = { "Player already exists with this name, player not added" },
                    Result = existingPlayer,
                };
            }

            await _auditingHelper.SetUpdated(existingPlayer, token);
            existingPlayer.Captain = _player.Captain;
            existingPlayer.EmailAddress = _player.EmailAddress ?? existingPlayer.EmailAddress;
            _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
            return new ActionResult<TeamPlayer>
            {
                Success = true,
                Messages = { "Player undeleted from team" },
                Result = existingPlayer,
            };
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
        _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;

        return new ActionResult<TeamPlayer>
        {
            Success = true,
            Messages = { $"Player added to the {model.Name} team for the {season.Name} season" },
            Result = newPlayer,
        };
    }
}
using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddPlayerToTeamSeasonCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IAccessService _accessService;
    private readonly ICommandFactory _commandFactory;
    private readonly ICachingSeasonService _seasonService;
    private readonly IUserService _userService;
    private bool _addSeasonToTeamIfMissing = true;
    private Guid? _divisionId;
    private EditTeamPlayerDto? _player;
    private Guid? _seasonId;

    public AddPlayerToTeamSeasonCommand(
        ICachingSeasonService seasonService,
        ICommandFactory commandFactory,
        IAuditingHelper auditingHelper,
        IUserService userService,
        ScopedCacheManagementFlags cacheFlags,
        IAccessService accessService)
    {
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _auditingHelper = auditingHelper;
        _userService = userService;
        _cacheFlags = cacheFlags;
        _accessService = accessService;
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

    public virtual AddPlayerToTeamSeasonCommand ToDivision(Guid divisionId)
    {
        _divisionId = divisionId;
        return this;
    }

    public virtual AddPlayerToTeamSeasonCommand AddSeasonToTeamIfMissing(bool allowed)
    {
        _addSeasonToTeamIfMissing = allowed;
        return this;
    }

    public virtual async Task<ActionResult<TeamPlayer>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        _player.ThrowIfNull($"Player hasn't been set, ensure {nameof(ForPlayer)} is called");
        _seasonId.ThrowIfNull($"SeasonId hasn't been set, ensure {nameof(ToSeason)} is called");
        _divisionId.ThrowIfNull($"DivisionId hasn't been set, ensure {nameof(ToDivision)} is called");

        if (string.IsNullOrWhiteSpace(_player?.Name))
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Errors =
                {
                    "Player name cannot be empty",
                },
            };
        }

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
                Errors =
                {
                    "Player cannot be added, not logged in",
                },
                Success = false,
            };
        }

        var context = UserAccessContext.ForTeam(_seasonId!.Value, _divisionId!.Value, model.Id);
        var canManageTeams = await _accessService.HasAccess(user, AccessOption.ManageTeams, context, token);
        var canInputResultsForTeam = await _accessService.HasAccess(user, AccessOption.InputResults, context, token) && user.TeamId == model.Id;
        if (!canManageTeams && !canInputResultsForTeam)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Errors =
                {
                    "Player cannot be added, not permitted",
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

        var teamSeason = model.Seasons.SingleOrDefault(ts => ts.SeasonId == season.Id && ts.Deleted == null);
        if (teamSeason == null)
        {
            if (!_addSeasonToTeamIfMissing)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = false,
                    Warnings =
                    {
                        $"{season.Name} season is not attributed to team {model.Name}",
                    },
                };
            }

            var addSeasonCommand = _commandFactory.GetCommand<AddSeasonToTeamCommand>()
                .ForSeason(season.Id)
                .ForDivision(_divisionId!.Value);

            var result = await addSeasonCommand.ApplyUpdate(model, token);
            if (!result.Success || result.Result == null)
            {
                return result.As<TeamPlayer>()
                    .Merge(new ActionResult<TeamPlayer>
                    {
                        Success = false,
                        Warnings =
                        {
                            $"Could not add the {season.Name} season to team {model.Name}",
                        },
                    });
            }

            _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
            teamSeason = result.Result;
        }

        // should use SingleOrDefault, but as there are a couple of places where 2+ players exist with the same name
        // I've had to switch to FirstOrDefault to prevent issues creating the player again
        // (which will result in one of the players being used instead of creating a new player)
        var existingPlayer = teamSeason.Players.FirstOrDefault(p => p.Name.Trim().Equals(_player!.Name.Trim(), StringComparison.OrdinalIgnoreCase));
        if (existingPlayer != null)
        {
            if (existingPlayer.Deleted == null)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = true,
                    Messages =
                    {
                        "Player already exists with this name, player not added",
                    },
                    Result = existingPlayer,
                };
            }

            await _auditingHelper.SetUpdated(existingPlayer, token); // will undelete the player
            existingPlayer.Captain = _player!.Captain;
            existingPlayer.EmailAddress = _player.EmailAddress ?? existingPlayer.EmailAddress;
            existingPlayer.Gender = _player.Gender.FromGenderDto();
            existingPlayer.Name = _player.Name.Trim(); // in case the casing - for example - has changed
            _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
            _cacheFlags.EvictDivisionDataCacheForDivisionId = _divisionId;
            return new ActionResult<TeamPlayer>
            {
                Success = true,
                Messages =
                {
                    "Player undeleted from team",
                },
                Result = existingPlayer,
            };
        }

        var newPlayer = new TeamPlayer
        {
            Name = _player!.Name.Trim(),
            Captain = _player.Captain,
            EmailAddress = _player.EmailAddress,
            Id = Guid.NewGuid(),
            Gender = _player.Gender.FromGenderDto(),
        };
        await _auditingHelper.SetUpdated(newPlayer, token);
        teamSeason.Players.Add(newPlayer);
        _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = _divisionId;

        return new ActionResult<TeamPlayer>
        {
            Success = true,
            Messages =
            {
                $"Player added to the {model.Name} team for the {season.Name} season",
            },
            Result = newPlayer,
        };
    }
}

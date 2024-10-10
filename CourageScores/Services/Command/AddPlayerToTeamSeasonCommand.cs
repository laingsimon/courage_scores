using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddPlayerToTeamSeasonCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
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

        var canManageTeams = user.Access?.ManageTeams == true;
        var canInputResultsForTeam = user.Access?.InputResults == true && user.TeamId == model.Id;
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

        var existingPlayer = teamSeason.Players.SingleOrDefault(p => p.Name == _player!.Name);
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
            Name = _player!.Name,
            Captain = _player.Captain,
            EmailAddress = _player.EmailAddress,
            Id = Guid.NewGuid(),
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
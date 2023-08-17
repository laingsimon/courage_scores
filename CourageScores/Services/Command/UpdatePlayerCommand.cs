using System.Runtime.CompilerServices;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Services.Team;

namespace CourageScores.Services.Command;

public class UpdatePlayerCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly ISeasonService _seasonService;
    private readonly ITeamService _teamService;
    private readonly IUserService _userService;
    private EditTeamPlayerDto? _player;
    private Guid? _playerId;
    private Guid? _seasonId;

    public UpdatePlayerCommand(
        IUserService userService,
        ISeasonService seasonService,
        IAuditingHelper auditingHelper,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository,
        ITeamService teamService,
        ICommandFactory commandFactory)
    {
        _userService = userService;
        _seasonService = seasonService;
        _auditingHelper = auditingHelper;
        _gameRepository = gameRepository;
        _teamService = teamService;
        _commandFactory = commandFactory;
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

    public async Task<ActionResult<TeamPlayer>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
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
                Success = false,
                Errors =
                {
                    "Player cannot be updated, not logged in",
                },
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
                    "Player cannot be updated, not permitted",
                },
            };
        }

        var season = await _seasonService.Get(_seasonId.Value, token);
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

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == season.Id);
        if (teamSeason == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Warnings =
                {
                    $"Team {model.Name} is not registered to the {season.Name} season",
                },
            };
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId);
        if (player == null)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Warnings =
                {
                    $"Team does not have a player with this id for the {season.Name} season",
                },
            };
        }

        if (player.Updated != _player.LastUpdated)
        {
            return new ActionResult<TeamPlayer>
            {
                Success = false,
                Warnings =
                {
                    _player.LastUpdated == null
                        ? $"Unable to update {nameof(TeamPlayer)}, data integrity token is missing"
                        : $"Unable to update {nameof(TeamPlayer)}, {player.Editor} updated it before you at {player.Updated:d MMM yyyy HH:mm:ss}",
                },
            };
        }

        var updatedGames = await UpdateGames(token).CountAsync();

        if (_player.NewTeamId != null && _player.NewTeamId != model.Id)
        {
            if (updatedGames > 0)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = false,
                    Warnings =
                    {
                        "Cannot move a player once they've played in some games",
                    },
                };
            }

            var command = _commandFactory.GetCommand<AddPlayerToTeamSeasonCommand>()
                .ForPlayer(_player)
                .ToSeason(season.Id)
                .ToDivision(Guid.Empty) // division id isn't required as the team won't be added to a season
                .AddSeasonToTeamIfMissing(false);

            var addResult = await _teamService.Upsert(_player.NewTeamId.Value, command, token);
            if (!addResult.Success)
            {
                return new ActionResult<TeamPlayer>
                {
                    Success = false,
                    Errors = addResult.Errors.Concat(new[]
                    {
                        "Could not move the player to other team",
                    }).ToList(),
                    Warnings = addResult.Warnings,
                    Messages = addResult.Messages,
                };
            }

            // player has been added to the other team, can remove it from this team now
            await _auditingHelper.SetDeleted(player, token);

            return new ActionResult<TeamPlayer>
            {
                Success = true,
                Messages = addResult.Messages,
                Warnings = addResult.Warnings,
                Errors = addResult.Errors,
            };
        }

        player.Name = _player.Name;
        player.Captain = _player.Captain;
        player.EmailAddress = _player.EmailAddress ?? player.EmailAddress;
        await _auditingHelper.SetUpdated(player, token);
        return new ActionResult<TeamPlayer>
        {
            Success = true,
            Messages =
            {
                $"Player {player.Name} updated in the {season.Name} season, {updatedGames} game/s updated",
            },
            Result = player,
        };
    }

    private async IAsyncEnumerable<Models.Cosmos.Game.Game> UpdateGames([EnumeratorCancellation] CancellationToken token)
    {
        var games = _player!.GameId.HasValue
            ? _gameRepository.GetSome($"t.id = '{_player!.GameId!.Value}' and t.seasonId = '{_seasonId}'", token)
            : _gameRepository.GetSome($"t.seasonId = '{_seasonId}'", token);

        await foreach (var game in games.WithCancellation(token))
        {
            if (await UpdatePlayerDetailsInGame(game, token))
            {
                yield return game;
            }
        }
    }

    private async Task<bool> UpdatePlayerDetailsInGame(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        var updated = false;

        foreach (var match in game.Matches)
        {
            foreach (var p in match.AwayPlayers.Where(p => p.Id == _playerId))
            {
                p.Name = _player!.Name;
                updated = true;
            }

            foreach (var p in match.HomePlayers.Where(p => p.Id == _playerId))
            {
                p.Name = _player!.Name;
                updated = true;
            }
        }

        if (updated)
        {
            await _gameRepository.Upsert(game, token);
        }

        return updated;
    }
}
using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Game;
using CourageScores.Services.Team;

namespace CourageScores.Services.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Models.Cosmos.Team.Team, EditTeamDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly ICommandFactory _commandFactory;
    private readonly IGameService _gameService;
    private readonly IJsonSerializerService _serializer;
    private readonly ICachingTeamService _teamService;

    public AddOrUpdateTeamCommand(
        ICachingTeamService teamService,
        IGameService gameService,
        ICommandFactory commandFactory,
        ScopedCacheManagementFlags cacheFlags,
        IJsonSerializerService serializer)
    {
        _teamService = teamService;
        _gameService = gameService;
        _commandFactory = commandFactory;
        _cacheFlags = cacheFlags;
        _serializer = serializer;
    }

    protected override async Task<ActionResult<Models.Cosmos.Team.Team>> ApplyUpdates(Models.Cosmos.Team.Team team, EditTeamDto update, CancellationToken token)
    {
        var games = _gameService.GetWhere($"t.DivisionId = '{update.DivisionId}' and t.SeasonId = '{update.SeasonId}'", token);

        var gamesToUpdate = new List<EditGameDto>();
        var gamesWithSameHomeAddressAsUpdate = await GamesWithSameHomeAddress(update, games, gamesToUpdate, token);

        if (gamesWithSameHomeAddressAsUpdate.Any(date => date.Value.Count > 1))
        {
            // multiple games would exist at the same home address, which isn't permitted
            var detail = gamesWithSameHomeAddressAsUpdate.Where(pair => pair.Value.Count > 1).Select(pair =>
            {
                return $"{pair.Key:dd MMM yyyy}: {string.Join(", ", pair.Value.Select(g => $"{g.Home.Name} vs {g.Away.Name}"))}";
            });

            return new ActionResult<Models.Cosmos.Team.Team>
            {
                Success = false,
                Warnings =
                {
                    $"Unable to update address, {update.Address} is in use for multiple games on the same dates, see {string.Join("\n", detail)}",
                },
            };
        }

        if (gamesToUpdate.Count > 0 && update.DivisionId != update.NewDivisionId)
        {
            // some games assigned to this team in the current division, not possible to change team division as it would require the game division to change too
            return new ActionResult<Models.Cosmos.Team.Team>
            {
                Success = false,
                Warnings =
                {
                    $"Unable to change division when games exist, delete these {gamesToUpdate.Count} game/s first",
                },
            };
        }

        foreach (var gameUpdate in gamesToUpdate)
        {
            var command = _commandFactory.GetCommand<AddOrUpdateGameCommand>().WithData(gameUpdate);
            await _gameService.Upsert(gameUpdate.Id, command, token);
        }

        // ReSharper disable once ConditionalAccessQualifierIsNonNullableAccordingToAPIContract
        team.Name = update.Name?.Trim() ?? "";
        // ReSharper disable once ConditionalAccessQualifierIsNonNullableAccordingToAPIContract
        team.Address = update.Address?.Trim() ?? "";
        var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == update.SeasonId && ts.Deleted == null);
        if (teamSeason == null)
        {
            var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>();
            var result = await command.ForSeason(update.SeasonId).ForDivision(update.NewDivisionId).ApplyUpdate(team, token);

            if (!result.Success || result.Result == null)
            {
                return result
                    .As<Models.Cosmos.Team.Team>()
                    .Merge(new ActionResult<Models.Cosmos.Team.Team>
                    {
                        Success = false,
                    });
            }

            teamSeason = result.Result;
        }

        teamSeason.DivisionId = update.NewDivisionId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = update.DivisionId;
        _cacheFlags.EvictDivisionDataCacheForSeasonId = update.SeasonId;
        return new ActionResult<Models.Cosmos.Team.Team>
        {
            Success = true,
            Messages =
            {
                "Team updated",
            },
        };
    }

    private async Task<Dictionary<DateTime, HashSet<GameDto>>> GamesWithSameHomeAddress(EditTeamDto update,
        IAsyncEnumerable<GameDto> games,
        List<EditGameDto> gamesToUpdate,
        CancellationToken token)
    {
        var gamesWithSameHomeAddressAsUpdate = new Dictionary<DateTime, HashSet<GameDto>>();
        var addressLookup = new Dictionary<Guid, TeamDto?>();

        await foreach (var game in games.WithCancellation(token))
        {
            if (!addressLookup.ContainsKey(game.Home.Id))
            {
                addressLookup.Add(game.Home.Id, await _teamService.Get(game.Home.Id, token));
            }

            if (!gamesWithSameHomeAddressAsUpdate.ContainsKey(game.Date))
            {
                gamesWithSameHomeAddressAsUpdate.Add(game.Date, new HashSet<GameDto>());
            }

            var homeTeam = addressLookup[game.Home.Id];
            if (homeTeam?.Id == update.Id)
            {
                // the address will be the same
                gamesWithSameHomeAddressAsUpdate[game.Date].Add(game);
            }
            else if (homeTeam?.Address != null)
            {
                if (homeTeam.Address.Equals(update.Address, StringComparison.OrdinalIgnoreCase))
                {
                    gamesWithSameHomeAddressAsUpdate[game.Date].Add(game);
                }
                else if (!string.IsNullOrEmpty(game.Address) && game.Address.Equals(update.Address, StringComparison.OrdinalIgnoreCase))
                {
                    gamesWithSameHomeAddressAsUpdate[game.Date].Add(game);
                }
            }

            if (game.Home.Id == update.Id)
            {
                var editGame = GameDtoToEditGameDto(game);
                editGame.Address = update.Address?.Trim() ?? "";
                editGame.DivisionId = update.NewDivisionId;
                gamesToUpdate.Add(editGame);
            }
        }

        return gamesWithSameHomeAddressAsUpdate;
    }

    private EditGameDto GameDtoToEditGameDto(GameDto game)
    {
        var editGame = _serializer.DeserialiseTo<EditGameDto>(_serializer.SerialiseToString(game));
        editGame.AwayTeamId = game.Away.Id;
        editGame.HomeTeamId = game.Home.Id;

        return editGame;
    }
}
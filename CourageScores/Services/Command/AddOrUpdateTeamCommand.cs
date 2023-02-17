using CourageScores.Filters;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Game;
using CourageScores.Services.Team;

namespace CourageScores.Services.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Models.Cosmos.Team.Team, EditTeamDto>
{
    private readonly ITeamService _teamService;
    private readonly IGameService _gameService;
    private readonly ICommandFactory _commandFactory;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IJsonSerializerService _serializer;

    public AddOrUpdateTeamCommand(
        ITeamService teamService,
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

    protected override async Task<CommandResult> ApplyUpdates(Models.Cosmos.Team.Team team, EditTeamDto update, CancellationToken token)
    {
        var games = _gameService
            .GetWhere($"t.DivisionId = '{update.DivisionId}' and t.SeasonId = '{update.SeasonId}'", token);

        var gamesToUpdate = new List<EditGameDto>();
        var addressLookup = new Dictionary<Guid, TeamDto?>();
        var gamesWithSameHomeAddressAsUpdate = new Dictionary<DateTime, HashSet<GameDto>>();

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
                else if (game.Address.Equals(update.Address, StringComparison.OrdinalIgnoreCase))
                {
                    gamesWithSameHomeAddressAsUpdate[game.Date].Add(game);
                }
            }

            if (game.Home.Id == update.Id)
            {
                var editGame = GameDtoToEditGameDto(game);
                editGame.Address = update.Address;
                editGame.DivisionId = update.DivisionId;
                gamesToUpdate.Add(editGame);
            }
        }

        if (gamesWithSameHomeAddressAsUpdate.Any(date => date.Value.Count > 1))
        {
            // multiple games would exist at the same home address, which isn't permitted
            var detail = gamesWithSameHomeAddressAsUpdate.Where(pair => pair.Value.Count > 1).Select(pair =>
            {
                return $"{pair.Key:dd MMM yyyy}: {string.Join(", ", pair.Value.Select(g => $"{g.Home.Name} vs {g.Away.Name}"))}";
            });

            return new CommandResult
            {
                Success = false,
                Message = $"Unable to update address, {update.Address} is in use for multiple games on the same dates, see {string.Join("\n", detail)}",
            };
        }

        if (gamesToUpdate.Count > 0 && update.DivisionId != update.NewDivisionId)
        {
            // some games assigned to this team in the current division, not possible to change team division as it would require the game division to change too
            return new CommandResult
            {
                Success = false,
                Message = $"Unable to change division when games exist, delete these {gamesToUpdate.Count} game/s first",
            };
        }

        foreach (var gameUpdate in gamesToUpdate)
        {
            var command = _commandFactory.GetCommand<AddOrUpdateGameCommand>().WithData(gameUpdate);
            await _gameService.Upsert(gameUpdate.Id, command, token);
        }

        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.NewDivisionId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = update.DivisionId;
        _cacheFlags.EvictDivisionDataCacheForSeasonId = update.SeasonId;
        return CommandResult.SuccessNoMessage;
    }

    private EditGameDto GameDtoToEditGameDto(GameDto game)
    {
        var editGame = _serializer.DeserialiseTo<EditGameDto>(_serializer.SerialiseToString(game));
        editGame.AwayTeamId = game.Away.Id;
        editGame.HomeTeamId = game.Home.Id;

        return editGame;
    }
}

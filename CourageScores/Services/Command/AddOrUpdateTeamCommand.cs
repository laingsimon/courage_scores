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
        await foreach (var game in games.WhereAsync(g => g.Home.Id == update.Id || g.Away.Id == update.Id).WithCancellation(token))
        {
            if (game.Home.Id == update.Id && await TeamAddressesMatch(game.Away.Id, update.Address, token))
            {
                return new CommandResult
                {
                    Success = false,
                    Message = $"Unable to update address, {team.Name} is playing {game.Away.Name} (on {game.Date:MMM dd yyyy}) which is registered at the updated address",
                };
            }

            if (game.Away.Id == update.Id && await TeamAddressesMatch(game.Home.Id, update.Address, token))
            {
                return new CommandResult
                {
                    Success = false,
                    Message = $"Unable to update address, {team.Name} is playing {game.Home.Name} (on {game.Date:MMM dd yyyy}) which is registered at the updated address",
                };
            }

            var editGame = GameDtoToEditGameDto(game);
            editGame.Address = update.Address;
            editGame.DivisionId = update.DivisionId;

            gamesToUpdate.Add(editGame);
        }

        foreach (var gameUpdate in gamesToUpdate)
        {
            var command = _commandFactory.GetCommand<AddOrUpdateGameCommand>().WithData(gameUpdate);
            await _gameService.Upsert(gameUpdate.Id, command, token);
        }

        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.DivisionId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = update.DivisionId;
        _cacheFlags.EvictDivisionDataCacheForSeasonId = update.SeasonId;
        return CommandResult.SuccessNoMessage;
    }

    private async Task<bool> TeamAddressesMatch(Guid id, string address, CancellationToken token)
    {
        var team = await _teamService.Get(id, token);
        return team?.Address.Equals(address, StringComparison.OrdinalIgnoreCase) == true;
    }

    private EditGameDto GameDtoToEditGameDto(GameDto game)
    {
        var editGame = _serializer.DeserialiseTo<EditGameDto>(_serializer.SerialiseToString(game));
        editGame.AwayTeamId = game.Away.Id;
        editGame.HomeTeamId = game.Home.Id;

        return editGame;
    }
}

using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class GameController : Controller
{
    private readonly IGenericDataService<Game, GameDto> _gameService;
    private readonly ICommandFactory _commandFactory;

    public GameController(IGenericDataService<Game, GameDto> gameService, ICommandFactory commandFactory)
    {
        _gameService = gameService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Game/{id}")]
    public async Task<GameDto?> GetGame(Guid id, CancellationToken token)
    {
        return await _gameService.Get(id, token);
    }

    [HttpGet("/api/Game/")]
    public IAsyncEnumerable<GameDto> GetGames(CancellationToken token)
    {
        return _gameService.GetAll(token);
    }

    [HttpPut("/api/Game/")]
    public async Task<ActionResultDto<GameDto>> AddOrUpdateGame(EditGameDto game, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateGameCommand>().WithData(game);
        return await _gameService.Upsert(game.Id, command, token);
    }

    [HttpDelete("/api/Game/{id}")]
    public async Task<ActionResultDto<GameDto>> DeleteGame(Guid id, CancellationToken token)
    {
        return await _gameService.Delete(id, token);
    }
}
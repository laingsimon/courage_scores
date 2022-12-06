using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class KnockoutGameController : Controller
{
    private readonly IGenericDataService<KnockoutGame, KnockoutGameDto> _gameService;
    private readonly ICommandFactory _commandFactory;

    public KnockoutGameController(IGenericDataService<KnockoutGame, KnockoutGameDto> gameService, ICommandFactory commandFactory)
    {
        _gameService = gameService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Knockout/{id}")]
    public async Task<KnockoutGameDto?> GetGame(Guid id, CancellationToken token)
    {
        return await _gameService.Get(id, token);
    }

    [HttpGet("/api/Knockout/")]
    public IAsyncEnumerable<KnockoutGameDto> GetGames(CancellationToken token)
    {
        return _gameService.GetAll(token);
    }

    [HttpPut("/api/Knockout/")]
    public async Task<ActionResultDto<KnockoutGameDto>> AddOrUpdateGame(EditKnockoutGameDto game, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateKnockoutGameCommand>().WithData(game);
        return await _gameService.Upsert(game.Id, command, token);
    }

    [HttpPut("/api/KnockoutScores/{id}")]
    public async Task<ActionResultDto<KnockoutGameDto>> AddOrUpdateScore(Guid id, KnockoutRoundDto round, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UpdateKnockoutRoundsCommand>().WithData(round);
        return await _gameService.Upsert(id, command, token);
    }

    [HttpDelete("/api/Knockout/{id}")]
    public async Task<ActionResultDto<KnockoutGameDto>> DeleteGame(Guid id, CancellationToken token)
    {
        return await _gameService.Delete(id, token);
    }
}
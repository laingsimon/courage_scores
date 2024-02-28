using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Command;
using CourageScores.Services.Game;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class GameController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly IGameService _gameService;

    public GameController(IGameService gameService, ICommandFactory commandFactory)
    {
        _gameService = gameService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Game/{id}")]
    public async Task<GameDto?> Get(Guid id, CancellationToken token)
    {
        return await _gameService.Get(id, token);
    }

    [HttpGet("/api/Game/")]
    public IAsyncEnumerable<GameDto> GetGames(CancellationToken token)
    {
        return _gameService.GetAll(token);
    }

    [HttpPut("/api/Game/")]
    public async Task<ActionResultDto<GameDto>> Update(EditGameDto game, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateGameCommand>().WithData(game);
        return await _gameService.Upsert(game.Id, command, token);
    }

    [HttpPut("/api/Scores/{id}")]
    public async Task<ActionResultDto<GameDto>> UpdateScores(Guid id, RecordScoresDto scores, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UpdateScoresCommand>().WithData(scores);
        return await _gameService.Upsert(id, command, token);
    }

    [HttpDelete("/api/Game/{id}")]
    public async Task<ActionResultDto<GameDto>> Delete(Guid id, CancellationToken token)
    {
        return await _gameService.Delete(id, token);
    }

    [HttpPost("/api/Scores/Photo")]
    public async Task<ActionResultDto<GameDto>> UploadPhoto([FromForm] UploadPhotoDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UploadPhotoCommand>().WithPhoto(request.Photo);
        return await _gameService.Upsert(request.Id, command, token);
    }
}
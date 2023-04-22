using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Command;
using CourageScores.Services.Game;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class GameController : Controller
{
    private readonly IGameService _gameService;
    private readonly ICommandFactory _commandFactory;
    private readonly ISaygStorageService _saygStorageService;

    public GameController(IGameService gameService, ICommandFactory commandFactory, ISaygStorageService saygStorageService)
    {
        _gameService = gameService;
        _commandFactory = commandFactory;
        _saygStorageService = saygStorageService;
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

    [HttpPut("/api/Scores/{id}")]
    public async Task<ActionResultDto<GameDto>> AddOrUpdateScore(Guid id, RecordScoresDto scores, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UpdateScoresCommand>().WithData(scores);
        return await _gameService.Upsert(id, command, token);
    }

    [HttpDelete("/api/Game/{id}")]
    public async Task<ActionResultDto<GameDto>> DeleteGame(Guid id, CancellationToken token)
    {
        return await _gameService.Delete(id, token);
    }

    [HttpPost("/api/Game/Sayg")]
    public async Task<ActionResultDto<RecordedScoreAsYouGoDto>> StoreSaygData([FromBody] RecordedScoreAsYouGoDto data, CancellationToken token)
    {
        return await _saygStorageService.UpsertData(data, token);
    }

    [HttpGet("/api/Game/Sayg/{id}")]
    public async Task<RecordedScoreAsYouGoDto?> GetSaygData(Guid id, CancellationToken token)
    {
        return await _saygStorageService.Get(id, token);
    }

    [HttpDelete("/api/Game/Sayg/{id}")]
    public async Task<ActionResultDto<RecordedScoreAsYouGoDto?>> DeleteSaygData(Guid id, CancellationToken token)
    {
        return await _saygStorageService.Delete(id, token);
    }
}
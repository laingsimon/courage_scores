using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class TournamentGameController : Controller
{
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _gameService;
    private readonly ICommandFactory _commandFactory;

    public TournamentGameController(IGenericDataService<TournamentGame, TournamentGameDto> gameService, ICommandFactory commandFactory)
    {
        _gameService = gameService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Tournament/{id}")]
    public async Task<TournamentGameDto?> GetGame(Guid id, CancellationToken token)
    {
        return await _gameService.Get(id, token);
    }

    [HttpGet("/api/Tournament/")]
    public IAsyncEnumerable<TournamentGameDto> GetGames(CancellationToken token)
    {
        return _gameService.GetAll(token);
    }

    [HttpPut("/api/Tournament/")]
    public async Task<ActionResultDto<TournamentGameDto>> AddOrUpdateGame(EditTournamentGameDto game, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateTournamentGameCommand>().WithData(game);
        return await _gameService.Upsert(game.Id, command, token);
    }

    [HttpPut("/api/TournamentScores/{id}")]
    public async Task<ActionResultDto<TournamentGameDto>> AddOrUpdateScore(Guid id, TournamentRoundDto round, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UpdateTournamentRoundsCommand>().WithData(round);
        return await _gameService.Upsert(id, command, token);
    }

    [HttpDelete("/api/Tournament/{id}")]
    public async Task<ActionResultDto<TournamentGameDto>> DeleteGame(Guid id, CancellationToken token)
    {
        return await _gameService.Delete(id, token);
    }
}
﻿using System.Diagnostics.CodeAnalysis;
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
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _tournamentService;

    public TournamentGameController(IGenericDataService<TournamentGame, TournamentGameDto> tournamentService, ICommandFactory commandFactory)
    {
        _tournamentService = tournamentService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Tournament/{id}")]
    public async Task<TournamentGameDto?> GetGame(Guid id, CancellationToken token)
    {
        return await _tournamentService.Get(id, token);
    }

    [HttpGet("/api/Tournament/")]
    public IAsyncEnumerable<TournamentGameDto> GetGames(CancellationToken token)
    {
        return _tournamentService.GetAll(token);
    }

    [HttpPut("/api/Tournament/")]
    public async Task<ActionResultDto<TournamentGameDto>> AddOrUpdateGame(EditTournamentGameDto game, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateTournamentGameCommand>().WithData(game);
        return await _tournamentService.Upsert(game.Id, command, token);
    }

    [HttpDelete("/api/Tournament/{id}")]
    public async Task<ActionResultDto<TournamentGameDto>> DeleteGame(Guid id, CancellationToken token)
    {
        return await _tournamentService.Delete(id, token);
    }

    [HttpPatch("/api/Tournament/{id}")]
    public async Task<ActionResultDto<TournamentGameDto>> PatchGame(Guid id, PatchTournamentDto patch, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<PatchTournamentCommand>().WithPatch(patch);
        return await _tournamentService.Upsert(id, command, token);
    }

    [HttpPost("/api/Tournament/{id}")]
    public async Task<ActionResultDto<TournamentGameDto>> CreateSayg(Guid id, CreateTournamentSaygDto saygRequest, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<CreateTournamentMatchSaygCommand>().WithRequest(saygRequest);
        return await _tournamentService.Upsert(id, command, token);
    }

    [HttpDelete("/api/Tournament/{id}/{matchId}")]
    public async Task<ActionResultDto<TournamentGameDto>> CreateSayg(Guid id, Guid matchId, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<DeleteTournamentMatchSaygCommand>().FromMatch(matchId);
        return await _tournamentService.Upsert(id, command, token);
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class NoteController : Controller
{
    private readonly IGenericDataService<FixtureDateNote, FixtureDateNoteDto> _noteService;
    private readonly ICommandFactory _commandFactory;

    public NoteController(
        IGenericDataService<FixtureDateNote, FixtureDateNoteDto> noteService,
        ICommandFactory commandFactory)
    {
        _noteService = noteService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Note/{seasonId}")]
    public IAsyncEnumerable<FixtureDateNoteDto> GetForSeason(Guid seasonId, CancellationToken token)
    {
        return _noteService.GetWhere($"t.SeasonId = '{seasonId}'", token);
    }

    [HttpPut("/api/Note/{id}")]
    public async Task<ActionResultDto<FixtureDateNoteDto>> Upsert(Guid id, FixtureDateNoteDto note, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateNoteCommand>().WithData(note);
        return await _noteService.Upsert(id, command, token);
    }

    [HttpPost("/api/Note")]
    public async Task<ActionResultDto<FixtureDateNoteDto>> Create(FixtureDateNoteDto note, CancellationToken token)
    {
        return await Upsert(Guid.NewGuid(), note, token);
    }

    [HttpDelete("/api/Note/{id}")]
    public async Task<ActionResultDto<FixtureDateNoteDto>> Delete(Guid id, CancellationToken token)
    {
        return await _noteService.Delete(id, token);
    }
}
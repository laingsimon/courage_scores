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
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<FixtureDateNote, FixtureDateNoteDto> _noteService;

    public NoteController(
        IGenericDataService<FixtureDateNote, FixtureDateNoteDto> noteService,
        ICommandFactory commandFactory)
    {
        _noteService = noteService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Note/{seasonId}")]
    public IAsyncEnumerable<FixtureDateNoteDto> Get(Guid seasonId, CancellationToken token)
    {
        return _noteService.GetWhere($"t.SeasonId = '{seasonId}'", token);
    }

    [HttpPut("/api/Note/{id}")]
    public async Task<ActionResultDto<FixtureDateNoteDto>> Upsert(Guid id, EditFixtureDateNoteDto note, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateNoteCommand>().WithData(note);
        return await _noteService.Upsert(id, command, token);
    }

    [HttpPost("/api/Note")]
    public async Task<ActionResultDto<FixtureDateNoteDto>> Create(EditFixtureDateNoteDto note, CancellationToken token)
    {
        return await Upsert(Guid.Empty, note, token);
    }

    [HttpDelete("/api/Note/{id}")]
    public async Task<ActionResultDto<FixtureDateNoteDto>> Delete(Guid id, CancellationToken token)
    {
        return await _noteService.Delete(id, token);
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class SaygController : ControllerBase
{
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygStorageService;

    public SaygController(
        ICommandFactory commandFactory,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygStorageService)
    {
        _commandFactory = commandFactory;
        _saygStorageService = saygStorageService;
    }

    [HttpPost("/api/Sayg")]
    public async Task<ActionResultDto<RecordedScoreAsYouGoDto>> StoreSaygData([FromBody] UpdateRecordedScoreAsYouGoDto data, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateSaygCommand>().WithData(data);
        return await _saygStorageService.Upsert(data.Id, command, token);
    }

    [HttpGet("/api/Sayg/{id}")]
    public async Task<RecordedScoreAsYouGoDto?> GetSaygData(Guid id, CancellationToken token)
    {
        return await _saygStorageService.Get(id, token);
    }

    [HttpDelete("/api/Sayg/{id}")]
    public async Task<ActionResultDto<RecordedScoreAsYouGoDto>> DeleteSaygData(Guid id, CancellationToken token)
    {
        return await _saygStorageService.Delete(id, token);
    }
}
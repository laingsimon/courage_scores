using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Analysis;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class SaygController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygStorageService;
    private readonly IAnalysisService _analysisService;

    public SaygController(
        ICommandFactory commandFactory,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygStorageService,
        IAnalysisService analysisService)
    {
        _commandFactory = commandFactory;
        _saygStorageService = saygStorageService;
        _analysisService = analysisService;
    }

    [HttpPost("/api/Sayg")]
    public async Task<ActionResultDto<RecordedScoreAsYouGoDto>> Upsert([FromBody] UpdateRecordedScoreAsYouGoDto data, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateSaygCommand>().WithData(data);
        return await _saygStorageService.Upsert(data.Id, command, token);
    }

    [HttpGet("/api/Sayg/{id}")]
    public async Task<RecordedScoreAsYouGoDto?> Get(Guid id, CancellationToken token)
    {
        return await _saygStorageService.Get(id, token);
    }

    [HttpDelete("/api/Sayg/{id}")]
    public async Task<ActionResultDto<RecordedScoreAsYouGoDto>> Delete(Guid id, CancellationToken token)
    {
        return await _saygStorageService.Delete(id, token);
    }

    [HttpPost("/api/Sayg/Analyse")]
    public async Task<ActionResultDto<AnalysisResponseDto>> Analyse(AnalysisRequestDto request, CancellationToken token)
    {
        return await _analysisService.Analyse(request, token);
    }
}

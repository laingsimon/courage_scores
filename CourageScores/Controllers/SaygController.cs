using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Game;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class SaygController : ControllerBase
{
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygStorageService;
    private readonly ISaygLiveService _saygLiveService;

    public SaygController(
        ICommandFactory commandFactory,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygStorageService,
        ISaygLiveService saygLiveService)
    {
        _commandFactory = commandFactory;
        _saygStorageService = saygStorageService;
        _saygLiveService = saygLiveService;
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

    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("/api/Sayg/{id}/live")]
    public async Task Subscribe(Guid id, CancellationToken token)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("Should be requested as a web-socket", token);
            return;
        }

        var socket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        await _saygLiveService.Connect(socket, id, token);
    }
}
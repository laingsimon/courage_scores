using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper;
using TypeScriptMapper.Controllers;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
[MethodsOnly]
public class LiveController : Controller
{
    private readonly ILiveService _liveService;

    public LiveController(ILiveService liveService)
    {
        _liveService = liveService;
    }

    [ExcludeFromTypeScript]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("/api/Live")]
    public async Task Subscribe(CancellationToken token)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("Should be requested as a web-socket", token);
            return;
        }

        var socket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        var query = HttpContext.Request.Query;
        var originatingUrl = query.ContainsKey("referrer")
            ? query["referrer"].ToString()
            : null;
        await _liveService.Accept(socket, originatingUrl ?? "unknown", token);
    }

    [HttpGet("/api/Live/Sockets")]
    public async Task<ActionResultDto<List<WebSocketDto>>> GetAll(CancellationToken token)
    {
        return await _liveService.GetSockets(token);
    }

    [HttpDelete("/api/Live/Socket/{id}")]
    public async Task<ActionResultDto<WebSocketDto>> Close(Guid id, CancellationToken token)
    {
        return await _liveService.CloseSocket(id, token);
    }
}
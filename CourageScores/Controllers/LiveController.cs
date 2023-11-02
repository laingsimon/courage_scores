using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class LiveController : Controller
{
    private readonly ILiveService _liveService;

    public LiveController(ILiveService liveService)
    {
        _liveService = liveService;
    }

    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("/api/Live/{id}")]
    public async Task Subscribe(Guid id, CancellationToken token)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("Should be requested as a web-socket", token);
            return;
        }

        var socket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        await _liveService.Accept(socket, id, token);
    }
}
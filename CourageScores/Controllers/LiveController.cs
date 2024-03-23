using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using TypeScriptMapper;
using TypeScriptMapper.Controllers;

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

    [HttpGet("/api/Live/Update/{id}/{type}")]
    [AddHeader("If-Modified-Since", "lastUpdated")]
    public async Task<ActionResultDto<UpdatedDataDto?>> GetUpdate(Guid id, LiveDataType type, CancellationToken token)
    {
        var lastUpdateValue = AsDateTime(Request.Headers.IfModifiedSince);
        var dto =  await _liveService.GetUpdate(id, type, lastUpdateValue, token);

        if (dto.Result != null)
        {
            var lastUpdated = dto.Result.LastUpdate;
            Response.Headers.LastModified = new StringValues(lastUpdated.ToString("R"));
            Response.StatusCode = dto.Result.Data != null
                ? StatusCodes.Status200OK
                : StatusCodes.Status304NotModified;
        }
        else
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
        }

        return dto;
    }

    [HttpPost("/api/Live/Update/{id}/{type}")]
    public async Task PostUpdate(Guid id, LiveDataType type, [FromBody] object data, CancellationToken token)
    {
        await _liveService.ProcessUpdate(id, type, data, token);
        Response.Headers.Location = $"/api/Live/Update/{id}/{type}";
        Response.StatusCode = StatusCodes.Status302Found;
    }

    [HttpGet("/api/Live/Watch/{type?}")]
    public IAsyncEnumerable<WatchableDataDto> Watch(LiveDataType? type, CancellationToken token)
    {
        return _liveService.GetWatchableData(type, token);
    }

    private static DateTime? AsDateTime(StringValues value)
    {
        if (string.IsNullOrEmpty(value.ToString()))
        {
            return null;
        }

        return DateTime.TryParseExact(value.ToString(), "R", null, DateTimeStyles.None, out var dateTime)
            ? dateTime
            : null;
    }
}
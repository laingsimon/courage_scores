using System.Diagnostics.CodeAnalysis;
using System.Net.WebSockets;
using CourageScores.Models.Live;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Live;

[ExcludeFromCodeCoverage]
public class WebSocketContractFactory : IWebSocketContractFactory
{
    private readonly IJsonSerializerService _serializerService;
    private readonly IWebSocketMessageProcessor _processor;
    private readonly TimeProvider _systemClock;
    private readonly IUserService _userService;

    public WebSocketContractFactory(
        IJsonSerializerService serializerService,
        IWebSocketMessageProcessor processor,
        TimeProvider systemClock,
        IUserService userService)
    {
        _serializerService = serializerService;
        _processor = processor;
        _systemClock = systemClock;
        _userService = userService;
    }

    public async Task<IWebSocketContract> Create(WebSocket webSocket, string originatingUrl, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        var dto = new WebSocketDetail
        {
            Id = Guid.NewGuid(),
            Connected = _systemClock.GetUtcNow(),
            UserName = user?.Name,
            OriginatingUrl = originatingUrl,
        };
        return new WebSocketContract(webSocket, _serializerService, _processor, dto, _systemClock);
    }
}
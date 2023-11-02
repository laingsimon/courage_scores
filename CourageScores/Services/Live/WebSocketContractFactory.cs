using System.Diagnostics.CodeAnalysis;
using System.Net.WebSockets;

namespace CourageScores.Services.Live;

[ExcludeFromCodeCoverage]
public class WebSocketContractFactory : IWebSocketContractFactory
{
    private readonly IJsonSerializerService _serializerService;
    private readonly IWebSocketMessageProcessor _processor;

    public WebSocketContractFactory(IJsonSerializerService serializerService, IWebSocketMessageProcessor processor)
    {
        _serializerService = serializerService;
        _processor = processor;
    }

    public IWebSocketContract Create(WebSocket webSocket, Guid key)
    {
        return new WebSocketContract(webSocket, _serializerService, _processor)
        {
            DataId = key,
        };
    }
}
using System.Net.WebSockets;

namespace CourageScores.Services.Live;

public interface IWebSocketContractFactory
{
    Task<IWebSocketContract> Create(WebSocket webSocket, string originatingUrl, CancellationToken token);
}
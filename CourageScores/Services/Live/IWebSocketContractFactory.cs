using System.Net.WebSockets;

namespace CourageScores.Services.Live;

public interface IWebSocketContractFactory
{
    IWebSocketContract Create(WebSocket webSocket);
}
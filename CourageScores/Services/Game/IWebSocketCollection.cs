using System.Net.WebSockets;

namespace CourageScores.Services.Game;

public interface IWebSocketCollection : IReadOnlyCollection<WebSocket>
{
    void Add(Guid saygId, WebSocket webSocket);
    void Remove(WebSocket webSocket);
    IReadOnlyCollection<WebSocket> GetSockets(Guid saygId);
}
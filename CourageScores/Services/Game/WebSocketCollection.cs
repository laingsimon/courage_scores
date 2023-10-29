using System.Collections;
using System.Net.WebSockets;

namespace CourageScores.Services.Game;

/// <summary>
/// Will be registered as a singleton for the application
/// </summary>
public class WebSocketCollection : IWebSocketCollection
{
    private readonly Dictionary<Guid, HashSet<WebSocket>> _sockets = new();

    public int Count => _sockets.Sum(pair => pair.Value.Count);

    public void Add(Guid saygId, WebSocket webSocket)
    {
        if (!_sockets.TryGetValue(saygId, out var sockets))
        {
            sockets = new HashSet<WebSocket>();
            _sockets.Add(saygId, sockets);
        }

        sockets.Add(webSocket);
    }

    public void Remove(WebSocket webSocket)
    {
        foreach (var pair in _sockets)
        {
            pair.Value.Remove(webSocket);
        }
    }

    public IReadOnlyCollection<WebSocket> GetSockets(Guid saygId)
    {
        return _sockets.TryGetValue(saygId, out var sockets)
            ? sockets.ToArray()
            : Array.Empty<WebSocket>();
    }

    #region IReadOnlyCollection members
    public IEnumerator<WebSocket> GetEnumerator()
    {
        return _sockets.Values.SelectMany(sockets => sockets).GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
    #endregion
}
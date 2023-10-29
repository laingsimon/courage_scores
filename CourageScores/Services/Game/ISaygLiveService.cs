using System.Net.WebSockets;

namespace CourageScores.Services.Game;

public interface ISaygLiveService
{
    Task Connect(WebSocket socket, Guid saygId, CancellationToken token);
}
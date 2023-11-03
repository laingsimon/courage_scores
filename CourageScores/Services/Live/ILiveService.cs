using System.Net.WebSockets;

namespace CourageScores.Services.Live;

public interface ILiveService
{
    Task Accept(WebSocket socket, Guid key, CancellationToken token);
}
using System.Net.WebSockets;

namespace CourageScores.Services.Live;

public interface ILiveService
{
    Task Accept(WebSocket socket, string originatingUrl, CancellationToken token);
}
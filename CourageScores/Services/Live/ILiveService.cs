using System.Net.WebSockets;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;

namespace CourageScores.Services.Live;

public interface ILiveService
{
    Task Accept(WebSocket socket, string originatingUrl, CancellationToken token);
    Task<ActionResultDto<List<WebSocketDto>>> GetSockets(CancellationToken token);
    Task<ActionResultDto<WebSocketDto>> CloseSocket(Guid socketId, CancellationToken token);
    Task<ActionResultDto<UpdatedDataDto?>> GetUpdate(Guid id, LiveDataType type, DateTimeOffset? lastUpdate, CancellationToken token);
}
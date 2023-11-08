using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;

namespace CourageScores.Services.Live;

public interface IWebSocketContract
{
    WebSocketDto WebSocketDto { get; }

    Task Accept(CancellationToken token);
    Task Send(LiveMessageDto message, CancellationToken token);
    bool IsSubscribedTo(Guid id);
    Task Close(CancellationToken token);
}
using CourageScores.Models;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Live;

public interface IWebSocketContract
{
    WebSocketDetail Details { get; }

    Task Accept(CancellationToken token);
    Task Send(LiveMessageDto message, CancellationToken token);
    bool IsSubscribedTo(Guid id);
    Task Close(CancellationToken token);
}
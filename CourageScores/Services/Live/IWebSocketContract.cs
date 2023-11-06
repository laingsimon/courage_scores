using CourageScores.Models.Dtos;

namespace CourageScores.Services.Live;

public interface IWebSocketContract
{
    Task Accept(CancellationToken token);
    Task Send(LiveMessageDto message, CancellationToken token);
    bool IsSubscribedTo(Guid id);
}
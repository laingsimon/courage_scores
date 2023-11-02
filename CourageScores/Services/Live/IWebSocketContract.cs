using CourageScores.Models.Dtos;

namespace CourageScores.Services.Live;

public interface IWebSocketContract
{
    Guid DataId { get; init; }
    Task Accept(CancellationToken token);
    Task Send(LiveMessageDto message, CancellationToken token);
}
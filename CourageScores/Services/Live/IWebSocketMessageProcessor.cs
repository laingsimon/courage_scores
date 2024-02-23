using CourageScores.Models.Dtos.Live;

namespace CourageScores.Services.Live;

public interface IWebSocketMessageProcessor
{
    void Disconnected(IWebSocketContract socket);

    Task PublishUpdate(IWebSocketContract source, Guid id, LiveDataType dataType, object dto, CancellationToken token);
}
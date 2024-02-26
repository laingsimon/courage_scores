using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;

namespace CourageScores.Services.Live;

public interface IWebSocketMessageProcessor
{
    void Disconnected(IWebSocketContract socket);

    Task PublishUpdate(IWebSocketContract source, Guid id, LiveDataType dataType, object dto, CancellationToken token);

    IAsyncEnumerable<WatchableData> GetWatchableData(CancellationToken token);
}
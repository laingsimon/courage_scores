namespace CourageScores.Services.Live;

public interface IWebSocketMessageProcessor
{
    void Unregister(IWebSocketContract socket);

    Task PublishUpdate(IWebSocketContract source, object dto, CancellationToken token);
}
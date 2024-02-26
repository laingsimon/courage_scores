using CourageScores.Models.Dtos.Live;

namespace CourageScores.Models.Live;

public class WatchableData
{
    public WebSocketDetail Connection { get; }
    public WebSocketPublication Publication { get; }
    public PublicationMode PublicationMode { get; }

    public WatchableData(WebSocketDetail connection, WebSocketPublication publication, PublicationMode mode)
    {
        Connection = connection;
        Publication = publication;
        PublicationMode = mode;
    }
}
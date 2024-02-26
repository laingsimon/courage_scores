using CourageScores.Models.Dtos.Live;

namespace CourageScores.Models.Live;

public class WebSocketPublication
{
    public DateTimeOffset LastUpdate { get; set; }
    public Guid Id { get; set; }
    public LiveDataType DataType { get; set; }
}
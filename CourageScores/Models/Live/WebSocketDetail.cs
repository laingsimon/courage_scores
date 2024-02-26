using System.Collections.Concurrent;

namespace CourageScores.Models.Live;

public class WebSocketDetail
{
    public Guid Id { get; set; }
    public string? OriginatingUrl { get; set; }
    public string? UserName { get; set; }
    public DateTimeOffset Connected { get; set; }
    public DateTimeOffset LastReceipt { get; set; }
    public DateTimeOffset? LastSent { get; set; }
    public List<Guid> Subscriptions { get; set; } = new();
    public ConcurrentBag<WebSocketPublication> Publishing { get; set; } = new();
    public int ReceivedMessages { get; set; }
    public int SentMessages { get; set; }
}
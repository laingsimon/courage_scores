using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Live;

[ExcludeFromCodeCoverage]
public class WebSocketDto
{
    /// <summary>
    /// Id of the socket
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Page where the socket was opened
    /// </summary>
    public string? OriginatingUrl { get; set; }

    /// <summary>
    /// Logged in user, if any, for the socket
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// When the socket was created
    /// </summary>
    public DateTimeOffset Connected { get; set; }

    /// <summary>
    /// Time the last message was sent from client -> server
    /// </summary>
    public DateTimeOffset LastReceipt { get; set; }

    /// <summary>
    /// Time the last message was sent from server -> client
    /// </summary>
    public DateTimeOffset? LastSent { get; set; }

    /// <summary>
    /// The ids of data points this socket is subscribed to
    /// </summary>
    public List<Guid> Subscriptions { get; set; } = new();

    /// <summary>
    /// The number of messages the server has received from the client
    /// </summary>
    public int ReceivedMessages { get; set; }

    /// <summary>
    /// The number of messages the server has sent to the client
    /// </summary>
    public int SentMessages { get; set; }
}
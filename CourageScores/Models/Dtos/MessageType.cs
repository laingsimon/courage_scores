namespace CourageScores.Models.Dtos;

public enum MessageType
{
    /// <summary>
    /// An unknown message type
    /// </summary>
    Unknown,
    /// <summary>
    /// A message from the client or server to indicate the connection is still active.
    /// The remote end should respond with <see cref="Polo"/>
    /// </summary>
    Marco,
    /// <summary>
    /// A message from the client or server in response to a <see cref="Marco"/> message
    /// </summary>
    Polo,
    /// <summary>
    /// An update to the sayg data, either from the client or to each each client
    /// </summary>
    Update,
    /// <summary>
    /// An error was encountered when the message was processed
    /// </summary>
    Error,
    /// <summary>
    /// The client has subscribed to the given id
    /// </summary>
    Subscribed,
    /// <summary>
    /// The client has unsubscribed from the given id
    /// </summary>
    Unsubscribed,
}
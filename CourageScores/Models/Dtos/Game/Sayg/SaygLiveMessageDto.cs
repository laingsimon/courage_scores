using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

[ExcludeFromCodeCoverage]
public class SaygLiveMessageDto
{
    /// <summary>
    /// The type of data
    /// </summary>
    public MessageType Type { get; set; } = MessageType.Unknown;

    /// <summary>
    /// The data for this message, if applicable
    /// </summary>
    public RecordedScoreAsYouGoDto? Data { get; set; }

    /// <summary>
    /// Any message relevant to the given message
    /// </summary>
    public string? Message { get; set; }

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
    }
}
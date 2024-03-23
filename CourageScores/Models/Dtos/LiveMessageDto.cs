using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Live;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class LiveMessageDto
{
    /// <summary>
    /// The type of data
    /// </summary>
    public MessageType Type { get; set; } = MessageType.Unknown;

    /// <summary>
    /// The data for this message, if applicable
    /// </summary>
    public object? Data { get; set; }

    /// <summary>
    /// Any message relevant to the given message
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// The id for the data, if applicable
    /// </summary>
    public Guid? Id { get; set; }

    /// <summary>
    /// The type of data in this update
    /// </summary>
    public LiveDataType DataType { get; set; }
}
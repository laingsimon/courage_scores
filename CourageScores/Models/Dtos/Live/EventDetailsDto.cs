using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Live;

[ExcludeFromCodeCoverage]
public class EventDetailsDto
{
    /// <summary>
    /// The location of the event
    /// </summary>
    public string? Venue { get; set; }

    /// <summary>
    /// If applicable, the type of event
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// If applicable, the opponents
    /// </summary>
    public List<string?>? Opponents { get; set; }
}
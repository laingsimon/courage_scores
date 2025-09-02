using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Formatters;

[ExcludeFromCodeCoverage]
public class CalendarEvent
{
    public Guid Id { get; init; } // id of fixture/note
    public DateTime FromInclusive { get; init; }
    public DateTime ToExclusive { get; init; }
    public DateTime LastUpdated { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public Uri? Url { get; init; }
    public string? Location { get; init; }
    public int Version { get; init; }
    public List<string> Categories { get; init; } = new();
    public bool Private { get; init; } = false; // false = TRANSPARENT, true = OPAQUE
    public bool Confirmed { get; init; } = true;
}

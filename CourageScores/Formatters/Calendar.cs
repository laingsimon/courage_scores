using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Formatters;

[ExcludeFromCodeCoverage]
public class Calendar
{
    public string Method { get; init; } = "PUBLISH";
    public List<CalendarEvent> Events { get; init; } = new();
    public string Id { get; init; } = "couragescores";
    public string? Name { get; set; }
    public string? Description { get; set; }
    public TimeSpan? RefreshInterval { get; set; }
}

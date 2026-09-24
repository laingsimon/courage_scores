using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class NoteTemplate
{
    public Guid Id { get; set; }
    public DayOfWeek? AlternativeDayOfWeek { get; set; }
    public int? DivisionNumber { get; set; }
    public string Note { get; set; } = "";
}

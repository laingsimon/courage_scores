using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
public class NoteTemplateDto
{
    /// <summary>
    /// The id of this note
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The note
    /// </summary>
    public string Note { get; set; } = null!;

    /// <summary>
    /// The numbers of the division this note is specific to, null if for all divisions
    /// </summary>
    public int? DivisionNumber { get; set; }

    /// <summary>
    /// The day of the week the note should apply, if not the same day as the fixtures
    /// For example, Mid-season meeting is not on the same day of the week as league fixtures
    /// </summary>
    public DayOfWeek? AlternativeDayOfWeek { get; set; }
}

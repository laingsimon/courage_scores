namespace CourageScores.Models.Dtos;

public class FixtureDateNoteDto : AuditedDto
{
    /// <summary>
    /// The date for which this note applies
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The note to display
    /// </summary>
    public string Note { get; set; } = null!;

    /// <summary>
    /// The season for which this note applies
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// [Optional] The division for which this note applies
    /// </summary>
    public Guid? DivisionId { get; set; }
}
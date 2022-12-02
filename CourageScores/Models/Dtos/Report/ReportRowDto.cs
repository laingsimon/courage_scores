namespace CourageScores.Models.Dtos.Report;

/// <summary>
/// A row within a report
/// </summary>
public class ReportRowDto
{
    /// <summary>
    /// The id of the team
    /// </summary>
    public Guid TeamId { get; set; }

    /// <summary>
    /// The name of the team
    /// </summary>
    public string TeamName { get; set; } = null!;

    /// <summary>
    /// The id of the team player
    /// </summary>
    public Guid PlayerId { get; set; }

    /// <summary>
    /// The name of the player
    /// </summary>
    public string PlayerName { get; set; } = null!;

    /// <summary>
    /// The attributed value to this report row
    /// </summary>
    public double Value { get; set; }
}
using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Report;

/// <summary>
/// The data for a column within this row
/// </summary>
[ExcludeFromCodeCoverage]
public class ReportCellDto
{
    /// <summary>
    /// The id of the team
    /// </summary>
    public Guid? TeamId { get; set; }

    /// <summary>
    /// The name of the team
    /// </summary>
    public string? TeamName { get; set; }

    /// <summary>
    /// The id of the team player
    /// </summary>
    public Guid? PlayerId { get; set; }

    /// <summary>
    /// The name of the player
    /// </summary>
    public string? PlayerName { get; set; }

    /// <summary>
    /// The text to display in this cell
    /// </summary>
    public string Text { get; set; } = null!;

    /// <summary>
    /// The id of the tournament relevant for this row
    /// </summary>
    public Guid? TournamentId { get; set; }

    /// <summary>
    /// The id of the division relevant for this row
    /// </summary>
    public Guid? DivisionId { get; set; }

    /// <summary>
    /// The id of the division relevant for this row
    /// </summary>
    public string? DivisionName { get; set; }
}
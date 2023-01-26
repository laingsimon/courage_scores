using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Report;

/// <summary>
/// A collection of reports
/// </summary>
[ExcludeFromCodeCoverage]
public class ReportCollectionDto
{
    /// <summary>
    /// A list of reports
    /// </summary>
    public List<ReportDto> Reports { get; set; } = new();

    /// <summary>
    /// The division id
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// The season id
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// Any messages related to the creation of the reports
    /// </summary>
    public List<string> Messages { get; set; } = new();

    /// <summary>
    /// Time the reports were created
    /// </summary>
    public DateTime Created { get; set; }
}
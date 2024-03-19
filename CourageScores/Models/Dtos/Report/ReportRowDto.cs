using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Report;

/// <summary>
/// A row within a report
/// </summary>
[ExcludeFromCodeCoverage]
public class ReportRowDto
{
    /// <summary>
    /// The cells in this row
    /// </summary>
    public List<ReportCellDto> Cells { get; set; } = new();
}
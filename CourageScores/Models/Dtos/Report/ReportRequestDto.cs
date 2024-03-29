using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Report;

/// <summary>
/// A report request
/// </summary>
[ExcludeFromCodeCoverage]
public class ReportRequestDto
{
    public Guid DivisionId { get; set; }
    public Guid SeasonId { get; set; }
    public int TopCount { get; set; } = 3;
}
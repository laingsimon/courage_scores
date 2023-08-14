using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Report;

/// <summary>
/// A report
/// </summary>
[ExcludeFromCodeCoverage]
public class ReportDto
{
    /// <summary>
    /// The name of the report
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// A description of the report
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// The report content
    /// </summary>
    public List<ReportRowDto> Rows { get; set; } = new();

    /// <summary>
    /// The text to display to explain the value column
    /// </summary>
    public string ValueHeading { get; set; } = "Value";

    /// <summary>
    /// Whether this report driven from data from this division only
    /// </summary>
    public bool ThisDivisionOnly { get; set; }
}
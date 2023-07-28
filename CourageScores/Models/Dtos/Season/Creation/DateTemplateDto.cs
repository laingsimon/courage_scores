using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// Represents a template for a date within a season
/// </summary>
[ExcludeFromCodeCoverage]
public class DateTemplateDto
{
    /// <summary>
    /// The fixtures to create on this date
    /// </summary>
    public List<FixtureTemplateDto> Fixtures { get; set; } = new();
}
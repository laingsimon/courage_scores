using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// Represents a fixture
/// </summary>
[ExcludeFromCodeCoverage]
public class FixtureTemplateDto
{
    /// <summary>
    /// A link to the relevant home team
    /// </summary>
    public TeamPlaceholderDto Home { get; set; } = null!;

    /// <summary>
    /// A link to the relevant away team
    /// </summary>
    public TeamPlaceholderDto Away { get; set; } = null!;
}
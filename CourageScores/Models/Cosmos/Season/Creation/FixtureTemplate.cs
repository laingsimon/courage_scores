using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class FixtureTemplate
{
    public string Home { get; set; } = null!;
    public string? Away { get; set; }
}
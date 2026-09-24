using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class DateTemplate
{
    public List<FixtureTemplate> Fixtures { get; set; } = new();
    public List<NoteTemplate> Notes { get; set; } = new();
}

using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Health;

[ExcludeFromCodeCoverage]
public class DivisionDateHealthDto
{
    public DateTime Date { get; set; }
    public List<LeagueFixtureHealthDto> Fixtures { get; set; } = new();
}
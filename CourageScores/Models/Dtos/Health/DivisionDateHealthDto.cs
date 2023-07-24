using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Dtos.Health;

[ExcludeFromCodeCoverage]
public class DivisionDateHealthDto
{
    public DateTime Date { get; set; }
    public List<LeagueFixtureHealthDto> Fixtures { get; set; } = new();
}
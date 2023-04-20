using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionFixtureDateDto
{
    public DateTime Date { get; set; }
    public List<DivisionFixtureDto> Fixtures { get; set; } = new();
    public List<DivisionTournamentFixtureDetailsDto> TournamentFixtures { get; set; } = new();
    public List<FixtureDateNoteDto> Notes { get; set; } = new();
}
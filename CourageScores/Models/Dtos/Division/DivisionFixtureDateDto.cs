using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Dtos.Division;

public class DivisionFixtureDateDto
{
    public DateTime Date { get; set; }
    public List<DivisionFixtureDto> Fixtures { get; set; } = new ();
    public List<KnockoutGameDto> KnockoutFixtures { get; set; } = new();
    public bool HasKnockoutFixture { get; set; }
}
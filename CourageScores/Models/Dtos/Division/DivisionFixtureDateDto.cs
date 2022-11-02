namespace CourageScores.Models.Dtos.Division;

public class DivisionFixtureDateDto
{
    public DateTime Date { get; set; }
    public List<DivisionFixtureDto> Fixtures { get; set; } = new ();
}
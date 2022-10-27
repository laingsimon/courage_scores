namespace CourageScores.Models.Dtos.Division;

public class DivisionFixtureDto
{
    public DateTime Date { get; set; }
    public int? HomeScore { get; set; }
    public string? HomeTeam { get; set; }
    public int? AwayScore { get; set; }
    public string? AwayTeam { get; set; }
}
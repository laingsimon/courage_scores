namespace CourageScores.Models.Dtos.Division;

public class DivisionFixtureDto
{
    public Guid Id { get; set; }
    public int? HomeScore { get; set; }
    public DivisionFixtureTeamDto HomeTeam { get; set; } = null!;
    public int? AwayScore { get; set; }
    public DivisionFixtureTeamDto? AwayTeam { get; set; }
    public bool Proposal { get; set; }
    public bool Postponed { get; set; }
}
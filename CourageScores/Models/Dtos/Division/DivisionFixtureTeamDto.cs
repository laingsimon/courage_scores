namespace CourageScores.Models.Dtos.Division;

public class DivisionFixtureTeamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
}
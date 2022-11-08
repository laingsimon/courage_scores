namespace CourageScores.Models.Dtos.Division;

public class DivisionDataDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public Guid SeasonId { get; set; }
    public string SeasonName { get; set; } = null!;
    public List<DivisionTeamDto> Teams { get; set; } = new();
    public List<DivisionFixtureDateDto> Fixtures { get; set; } = new();
    public List<DivisionPlayerDto> Players { get; set; } = new();
}
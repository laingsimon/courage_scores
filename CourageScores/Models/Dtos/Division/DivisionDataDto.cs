using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Dtos.Division;

public class DivisionDataDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public List<DivisionTeamDto> Teams { get; set; } = new();
    public List<DivisionTeamDto> TeamsWithoutFixtures { get; set; } = new();
    public List<DivisionFixtureDateDto> Fixtures { get; set; } = new();
    public List<DivisionPlayerDto> Players { get; set; } = new();
    public DivisionDataSeasonDto Season { get; set; } = new();
    public List<DivisionDataSeasonDto> Seasons { get; set; } = new();
    public List<TeamDto> AllTeams { get; set; } = new();
}
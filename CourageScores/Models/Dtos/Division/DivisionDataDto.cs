using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionDataDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public List<DivisionTeamDto> Teams { get; set; } = new();
    public List<DivisionFixtureDateDto> Fixtures { get; set; } = new();
    public List<DivisionPlayerDto> Players { get; set; } = new();
    public DivisionDataSeasonDto Season { get; set; } = new();
    public List<DivisionDataSeasonDto> Seasons { get; set; } = new();
    public List<DivisionTeamDetailsDto> AllTeams { get; set; } = new();
}

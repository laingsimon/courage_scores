using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionDataDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime? Updated { get; set; }
    public List<DataErrorDto> DataErrors { get; set; } = new();
    public List<DivisionTeamDto> Teams { get; set; } = new();
    public List<DivisionFixtureDateDto> Fixtures { get; set; } = new();
    public List<DivisionPlayerDto> Players { get; set; } = new();
    public DivisionDataSeasonDto? Season { get; set; }
}
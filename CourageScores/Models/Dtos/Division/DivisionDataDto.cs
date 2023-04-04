using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionDataDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public List<string> DataErrors { get; set; } = new();
    public List<DivisionTeamDto> Teams { get; set; } = new();
    public List<DivisionFixtureDateDto> Fixtures { get; set; } = new();
    public List<DivisionPlayerDto> Players { get; set; } = new();
    public DivisionDataSeasonDto? Season { get; set; }
}

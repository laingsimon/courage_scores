using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Models.Dtos.Health;

[ExcludeFromCodeCoverage]
public class DivisionHealthDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public List<DivisionDateHealthDto> Dates { get; set; } = new();
    public List<DivisionTeamDto> Teams { get; set; } = new();
}
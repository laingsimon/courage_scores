using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionTeamDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
}
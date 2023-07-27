using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Health;

[ExcludeFromCodeCoverage]
public class SeasonHealthDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public List<DivisionHealthDto> Divisions { get; set; } = new();
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class Template : AuditedEntity
{
    public string Name { get; set; } = null!;
    public List<DivisionTemplate> Divisions { get; set; } = new();
    public List<SharedAddress> SharedAddresses { get; set; } = new();
    public SeasonHealthCheckResultDto? TemplateHealth { get; set; }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// A template for a season, defining the number of teams, divisions and shared addresses for those teams
/// </summary>
[ExcludeFromCodeCoverage]
public class TemplateDto : AuditedDto
{
    /// <summary>
    /// The name of this template
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// A template for each division within the season
    /// </summary>
    public List<DivisionTemplateDto> Divisions { get; set; } = new();

    /// <summary>
    /// The teams that can have the same address within different divisions
    /// </summary>
    public List<SharedAddressDto> SharedAddresses { get; set; } = new();

    /// <summary>
    /// The last recorded health analysis of this template
    /// </summary>
    public SeasonHealthCheckResultDto? TemplateHealth { get; set; }
}
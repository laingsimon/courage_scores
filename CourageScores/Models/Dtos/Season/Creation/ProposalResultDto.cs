using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
public class ProposalResultDto
{
    public Dictionary<string, DivisionTeamDto> PlaceholderMappings { get; set; } = new();
    public TemplateDto Template { get; set; } = new();
    public SeasonDto Season { get; set; } = new();
    public List<DivisionDataDto>? Divisions { get; set; }
    public SeasonHealthCheckResultDto? ProposalHealth { get; set; }
}
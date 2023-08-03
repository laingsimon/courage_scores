using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
public class ProposalResultDto
{
    public Dictionary<string, DivisionTeamDto> PlaceholderMappings { get; set; } = new();
    public TemplateDto Template { get; set; } = new();
    public SeasonDto Season { get; set; } = new();
    public List<DivisionDataDto> Divisions { get; set; } = new();
}
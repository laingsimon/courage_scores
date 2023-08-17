using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season.Creation;

[ExcludeFromCodeCoverage]
public class ProposalContext
{
    public ProposalContext(TemplateMatchContext matchContext, TemplateDto template,
        ActionResultDto<ProposalResultDto> result)
    {
        MatchContext = matchContext;
        Template = template;
        Result = result;
    }

    public TemplateMatchContext MatchContext { get; }
    public TemplateDto Template { get; }
    public ActionResultDto<ProposalResultDto> Result { get; }
    public Dictionary<string, TeamDto> PlaceholderMapping => Result.Result!.PlaceholderMappings;
}
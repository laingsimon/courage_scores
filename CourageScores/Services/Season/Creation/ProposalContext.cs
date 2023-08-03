using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

[ExcludeFromCodeCoverage]
public class ProposalContext
{
    public TemplateMatchContext MatchContext { get; }
    public TemplateDto Template { get; }
    public ActionResultDto<ProposalResultDto> Result { get; }
    public Dictionary<string, DivisionTeamDto> PlaceholderMapping => Result.Result!.PlaceholderMappings;

    public ProposalContext(TemplateMatchContext matchContext, TemplateDto template,
        ActionResultDto<ProposalResultDto> result)
    {
        MatchContext = matchContext;
        Template = template;
        Result = result;
    }
}
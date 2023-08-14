using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

public interface ISeasonProposalStrategy
{
    Task<ActionResultDto<ProposalResultDto>> ProposeFixtures(TemplateMatchContext context, TemplateDto template, CancellationToken token);
}
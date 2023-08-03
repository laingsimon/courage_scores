using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

public class TemplatedSeasonProposalStrategy : ISeasonProposalStrategy
{
    private readonly IAddressAssignmentStrategy _addressAssignmentStrategy;

    public TemplatedSeasonProposalStrategy(IAddressAssignmentStrategy addressAssignmentStrategy)
    {
        _addressAssignmentStrategy = addressAssignmentStrategy;
    }

    public async Task<ActionResultDto<ProposalResultDto>> ProposeFixtures(TemplateMatchContext matchContext, TemplateDto template, CancellationToken token)
    {
        var result = new ActionResultDto<ProposalResultDto>
        {
            Success = true,
            Result = new ProposalResultDto
            {
                Template = template,
                Season = matchContext.SeasonDto,
            },
        };

        var context = new ProposalContext(matchContext, template, result);

        if (!await _addressAssignmentStrategy.AssignAddresses(context, token))
        {
            result.Success = false;
            result.Warnings.Add("Could not assign all teams to placeholders in the template");
            return result;
        }

        return result;
    }
}
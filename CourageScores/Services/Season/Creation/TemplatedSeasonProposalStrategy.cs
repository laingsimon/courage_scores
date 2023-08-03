using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

public class TemplatedSeasonProposalStrategy : ISeasonProposalStrategy
{
    private readonly IAddressAssignmentStrategy _addressAssignmentStrategy;
    private readonly IFixtureDateAssignmentStrategy _dateAssignmentStrategy;

    public TemplatedSeasonProposalStrategy(
        IAddressAssignmentStrategy addressAssignmentStrategy,
        IFixtureDateAssignmentStrategy dateAssignmentStrategy)
    {
        _addressAssignmentStrategy = addressAssignmentStrategy;
        _dateAssignmentStrategy = dateAssignmentStrategy;
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
                Divisions = matchContext.Divisions,
            },
        };

        var context = new ProposalContext(matchContext, template, result);

        if (!await _addressAssignmentStrategy.AssignAddresses(context, token))
        {
            result.Success = false;
            result.Warnings.Add("Could not assign all teams to placeholders in the template");
            return result;
        }

        if (!await _dateAssignmentStrategy.AssignDates(context, token))
        {
            result.Success = false;
            result.Warnings.Add("Could not create all fixtures/dates from the template");
            return result;
        }

        // TODO: run the health check and present the results

        return result;
    }
}
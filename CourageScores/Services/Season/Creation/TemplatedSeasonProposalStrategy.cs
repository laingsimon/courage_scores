using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Health;

namespace CourageScores.Services.Season.Creation;

public class TemplatedSeasonProposalStrategy : ISeasonProposalStrategy
{
    private readonly IAddressAssignmentStrategy _addressAssignmentStrategy;
    private readonly IFixtureDateAssignmentStrategy _dateAssignmentStrategy;
    private readonly IHealthCheckService _healthCheckService;
    private readonly ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto> _seasonHealthAdapter;

    public TemplatedSeasonProposalStrategy(
        IAddressAssignmentStrategy addressAssignmentStrategy,
        IFixtureDateAssignmentStrategy dateAssignmentStrategy,
        IHealthCheckService healthCheckService,
        ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto> seasonHealthAdapter)
    {
        _addressAssignmentStrategy = addressAssignmentStrategy;
        _dateAssignmentStrategy = dateAssignmentStrategy;
        _healthCheckService = healthCheckService;
        _seasonHealthAdapter = seasonHealthAdapter;
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

        var healthCheckInput = await _seasonHealthAdapter.Adapt(new SeasonHealthDtoAdapter.SeasonAndDivisions(context.MatchContext.SeasonDto, context.MatchContext.Divisions), token);
        result.Result.ProposalHealth = await _healthCheckService.Check(healthCheckInput, token);

        return result;
    }
}
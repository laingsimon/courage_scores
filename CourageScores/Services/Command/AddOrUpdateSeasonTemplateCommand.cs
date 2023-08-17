using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Health;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonTemplateCommand : AddOrUpdateCommand<Template, EditTemplateDto>
{
    private readonly ISimpleOnewayAdapter<Template, SeasonHealthDto> _healthCheckAdapter;
    private readonly IHealthCheckService _healthCheckService;
    private readonly IAdapter<Template, TemplateDto> _templateAdapter;

    public AddOrUpdateSeasonTemplateCommand(
        IAdapter<Template, TemplateDto> templateAdapter,
        IHealthCheckService healthCheckService,
        ISimpleOnewayAdapter<Template, SeasonHealthDto> healthCheckAdapter)
    {
        _templateAdapter = templateAdapter;
        _healthCheckService = healthCheckService;
        _healthCheckAdapter = healthCheckAdapter;
    }

    protected override async Task<ActionResult<Template>> ApplyUpdates(Template template, EditTemplateDto update, CancellationToken token)
    {
        var dto = await _templateAdapter.Adapt(update, token);

        template.Name = dto.Name;
        template.Divisions = dto.Divisions;
        template.SharedAddresses = dto.SharedAddresses;

        try
        {
            var result = await _healthCheckService.Check(await _healthCheckAdapter.Adapt(template, token), token);
            template.TemplateHealth = result;
        }
        catch (Exception exc)
        {
            template.TemplateHealth = new SeasonHealthCheckResultDto
            {
                Errors =
                {
                    exc.Message,
                },
            };
        }

        return new ActionResult<Template>
        {
            Success = true,
            Messages =
            {
                "Template updated",
            },
        };
    }
}
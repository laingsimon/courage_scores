using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonTemplateCommand : AddOrUpdateCommand<Template, EditTemplateDto>
{
    private readonly IAdapter<Template, TemplateDto> _templateAdapter;

    public AddOrUpdateSeasonTemplateCommand(IAdapter<Template, TemplateDto> templateAdapter)
    {
        _templateAdapter = templateAdapter;
    }

    protected override async Task<ActionResult<Template>> ApplyUpdates(Template template, EditTemplateDto update, CancellationToken token)
    {
        var dto = await _templateAdapter.Adapt(update, token);

        template.Name = dto.Name;
        template.Divisions = dto.Divisions;
        template.SharedAddresses = dto.SharedAddresses;
        template.TemplateHealth = null; // TODO: Set the template health

        return new ActionResult<Template>
        {
            Success = true,
            Messages = { "Template updated" },
        };
    }
}
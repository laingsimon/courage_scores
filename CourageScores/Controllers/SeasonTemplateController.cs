using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class SeasonTemplateController : Controller
{
    private readonly IGenericDataService<Template, TemplateDto> _seasonTemplateService;
    private readonly ICommandFactory _commandFactory;

    public SeasonTemplateController(
        IGenericDataService<Template, TemplateDto> seasonTemplateService,
        ICommandFactory commandFactory)
    {
        _seasonTemplateService = seasonTemplateService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Template/{id}")]
    public async Task<TemplateDto?> GetTemplate(Guid id, CancellationToken token)
    {
        return await _seasonTemplateService.Get(id, token);
    }

    [HttpGet("/api/Template/")]
    public IAsyncEnumerable<TemplateDto> GetTemplates(CancellationToken token)
    {
        return _seasonTemplateService.GetAll(token);
    }

    [HttpPut("/api/Template/")]
    public async Task<ActionResultDto<TemplateDto>> AddOrUpdateTemplate(EditTemplateDto template, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateSeasonTemplateCommand>().WithData(template);
        return await _seasonTemplateService.Upsert(template.Id, command, token);
    }

    [HttpDelete("/api/Template/{id}")]
    public async Task<ActionResultDto<TemplateDto>> DeleteTemplate(Guid id, CancellationToken token)
    {
        return await _seasonTemplateService.Delete(id, token);
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Command;
using CourageScores.Services.Season.Creation;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class SeasonTemplateController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly ISeasonTemplateService _seasonTemplateService;

    public SeasonTemplateController(
        ISeasonTemplateService seasonTemplateService,
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

    [HttpGet("/api/Template/ForSeason/{seasonId}")]
    public async Task<ActionResultDto<List<ActionResultDto<TemplateDto>>>> GetForSeason(Guid seasonId, CancellationToken token)
    {
        return await _seasonTemplateService.GetForSeason(seasonId, token);
    }

    [HttpPost("/api/Template/Propose/")]
    public async Task<ActionResultDto<ProposalResultDto>> ProposeForSeason(ProposalRequestDto request, CancellationToken token)
    {
        return await _seasonTemplateService.ProposeForSeason(request, token);
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

    [HttpPost("/api/Template/Health")]
    public async Task<ActionResultDto<SeasonHealthCheckResultDto>> GetTemplateHealth(EditTemplateDto template, CancellationToken token)
    {
        return await _seasonTemplateService.GetTemplateHealth(template, token);
    }
}
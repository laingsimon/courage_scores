using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Command;
using CourageScores.Services.Health;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class SeasonController : Controller
{
    private readonly ISeasonService _seasonService;
    private readonly ICommandFactory _commandFactory;
    private readonly IHealthCheckService _healthCheckService;

    public SeasonController(CachingSeasonService seasonService, ICommandFactory commandFactory, IHealthCheckService healthCheckService)
    {
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _healthCheckService = healthCheckService;
    }

    [HttpGet("/api/Season/{id}")]
    public async Task<SeasonDto?> GetSeason(Guid id, CancellationToken token)
    {
        return await _seasonService.Get(id, token);
    }

    [HttpGet("/api/Season/")]
    public IAsyncEnumerable<SeasonDto> GetSeasons(CancellationToken token)
    {
        return _seasonService.GetAll(token);
    }

    [HttpPut("/api/Season/")]
    public async Task<ActionResultDto<SeasonDto>> AddOrUpdateSeason(EditSeasonDto season, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateSeasonCommand>().WithData(season);
        return await _seasonService.Upsert(season.Id, command, token);
    }

    [HttpDelete("/api/Season/{id}")]
    public async Task<ActionResultDto<SeasonDto>> DeleteSeason(Guid id, CancellationToken token)
    {
        return await _seasonService.Delete(id, token);
    }

    [HttpGet("/api/Season/{id}/health")]
    public async Task<SeasonHealthCheckResultDto> GetHealth(Guid id, CancellationToken token)
    {
        return await _healthCheckService.Check(id, token);
    }
}
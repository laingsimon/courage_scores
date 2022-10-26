using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class SeasonController : Controller
{
    private readonly IGenericDataService<Season, SeasonDto> _seasonService;
    private readonly ICommandFactory _commandFactory;

    public SeasonController(IGenericDataService<Season, SeasonDto> seasonService, ICommandFactory commandFactory)
    {
        _seasonService = seasonService;
        _commandFactory = commandFactory;
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
}
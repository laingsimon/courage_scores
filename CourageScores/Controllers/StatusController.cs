using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Status;
using CourageScores.Services.Status;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class StatusController : Controller
{
    private readonly IStatusService _statusService;

    public StatusController(IStatusService statusService)
    {
        _statusService = statusService;
    }

    [HttpGet("/api/Status")]
    public async Task<ActionResultDto<ServiceStatusDto>> GetStatus(CancellationToken token)
    {
        return await _statusService.GetStatus(token);
    }

    [HttpGet("/api/ClearCache")]
    public async Task<ActionResultDto<CacheClearedDto>> ClearCache(CancellationToken token)
    {
        return await _statusService.ClearCache(token);
    }

    [HttpGet("/api/Status/Cache")]
    public async Task<ActionResultDto<List<Dictionary<string, object?>>>> GetCacheKeys(CancellationToken token)
    {
        return await _statusService.GetCachedEntries(token);
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Services;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class FeatureController : Controller
{
    private readonly IFeatureService _featureService;

    public FeatureController(IFeatureService featureService)
    {
        _featureService = featureService;
    }

    [HttpGet("/api/Feature")]
    public IAsyncEnumerable<ConfiguredFeatureDto> GetFeatures(CancellationToken token)
    {
        return _featureService.GetAllFeatures(token);
    }

    [HttpPut("/api/Feature")]
    public async Task<ActionResultDto<ConfiguredFeatureDto>> UpdateFeature([FromBody] ReconfigureFeatureDto update, CancellationToken token)
    {
        return await _featureService.UpdateFeature(update, token);
    }
}
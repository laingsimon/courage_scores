using CourageScores.Models;
using CourageScores.Models.Dtos;

namespace CourageScores.Services;

public interface IFeatureService
{
    Task<ConfiguredFeatureDto?> Get(Feature feature, CancellationToken token);
    IAsyncEnumerable<ConfiguredFeatureDto> GetAllFeatures(CancellationToken token);
    Task<ActionResultDto<ConfiguredFeatureDto>> UpdateFeature(ReconfigureFeatureDto update, CancellationToken token);
}
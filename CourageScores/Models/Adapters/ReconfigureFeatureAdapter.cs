using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class ReconfigureFeatureAdapter : ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature>
{
    public Task<ConfiguredFeature> Adapt(ReconfigureFeatureDto model, CancellationToken token)
    {
        return Task.FromResult(new ConfiguredFeature
        {
            Id = model.Id,
            ConfiguredValue = model.ConfiguredValue?.Trim(),
        });
    }
}
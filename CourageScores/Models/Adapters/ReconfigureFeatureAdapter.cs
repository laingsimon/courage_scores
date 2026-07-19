using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters;

public class ReconfigureFeatureAdapter : ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature>
{
    public Task<ConfiguredFeature> Adapt(ReconfigureFeatureDto model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new ConfiguredFeature
        {
            Id = model.Id,
            ConfiguredValue = model.ConfiguredValue?.Trim(),
        });
    }
}

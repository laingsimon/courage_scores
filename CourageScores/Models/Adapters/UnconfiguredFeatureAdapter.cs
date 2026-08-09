using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters;

public class UnconfiguredFeatureAdapter : ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto>
{
    private readonly IAdapter<ConfiguredFeature, ConfiguredFeatureDto> _adapter;

    public UnconfiguredFeatureAdapter(IAdapter<ConfiguredFeature, ConfiguredFeatureDto> adapter)
    {
        _adapter = adapter;
    }

    public async Task<ConfiguredFeatureDto> Adapt(Guid model, UserAccessContext context, CancellationToken token)
    {
        var intermediary = new ConfiguredFeature
        {
            Id = model,
            ConfiguredValue = null,
        };

        return await _adapter.Adapt(intermediary, context, token);
    }
}

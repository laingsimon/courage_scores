using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class UnconfiguredFeatureAdapter : ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto>
{
    private readonly IAdapter<ConfiguredFeature, ConfiguredFeatureDto> _adapter;

    public UnconfiguredFeatureAdapter(IAdapter<ConfiguredFeature, ConfiguredFeatureDto> adapter)
    {
        _adapter = adapter;
    }

    public async Task<ConfiguredFeatureDto> Adapt(Guid model, CancellationToken token)
    {
        var intermediary = new ConfiguredFeature
        {
            Id = model,
            ConfiguredValue = null,
        };

        return await _adapter.Adapt(intermediary, token);
    }
}
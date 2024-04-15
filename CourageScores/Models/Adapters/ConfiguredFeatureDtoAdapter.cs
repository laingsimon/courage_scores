using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Repository;

namespace CourageScores.Models.Adapters;

public class ConfiguredFeatureDtoAdapter : IAdapter<ConfiguredFeature, ConfiguredFeatureDto>
{
    private readonly IFeatureLookup _featureLookup;

    public ConfiguredFeatureDtoAdapter(IFeatureLookup featureLookup)
    {
        _featureLookup = featureLookup;
    }

    public Task<ConfiguredFeatureDto> Adapt(ConfiguredFeature model, CancellationToken token)
    {
        var feature = _featureLookup.Get(model.Id);
        return Task.FromResult(new ConfiguredFeatureDto
        {
            Id = model.Id,
            ConfiguredValue = model.ConfiguredValue,
            Description = feature?.Description ?? "",
            DefaultValue = feature?.DefaultValue,
            ValueType = feature?.ValueType ?? Feature.FeatureValueType.Unknown,
            Name = feature?.Name ?? model.Id.ToString(),
        }.AddAuditProperties(model));
    }

    public Task<ConfiguredFeature> Adapt(ConfiguredFeatureDto dto, CancellationToken token)
    {
        return Task.FromResult(new ConfiguredFeature
        {
            Id = dto.Id,
            ConfiguredValue = dto.ConfiguredValue,
        }.AddAuditProperties(dto));
    }
}
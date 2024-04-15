using CourageScores.Models.Dtos;

namespace CourageScores.Services;

public class LoadedFeatures
{
    public Dictionary<Guid, ConfiguredFeatureDto>? Lookup { get; set; }
}
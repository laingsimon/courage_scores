namespace CourageScores.Models.Dtos;

public class ConfiguredFeatureDto : AuditedDto
{
    /// <summary>
    /// A short name for this feature
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// A description of this feature
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// The default value for this feature
    /// </summary>
    public string? DefaultValue { get; set; }

    /// <summary>
    /// The current value for this feature
    /// </summary>
    public string? ConfiguredValue { get; set; }

    /// <summary>
    /// The type of value that this feature can be configured with
    /// </summary>
    public Feature.FeatureValueType ValueType { get; set; }
}
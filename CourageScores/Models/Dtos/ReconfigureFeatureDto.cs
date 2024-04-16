namespace CourageScores.Models.Dtos;

public class ReconfigureFeatureDto : IFeatureDto
{
    /// <summary>
    /// The id of the feature to configure
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The value to configure this feature with
    /// </summary>
    public string? ConfiguredValue { get; set; }
}
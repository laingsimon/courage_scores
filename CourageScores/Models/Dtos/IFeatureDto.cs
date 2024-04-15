namespace CourageScores.Models.Dtos;

public interface IFeatureDto
{
    public Guid Id { get; set; }
    public string? ConfiguredValue { get; set; }
}
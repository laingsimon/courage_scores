using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class DivisionTemplate
{
    public List<string> Placeholders { get; set; } = new();
    public List<SharedAddress> SharedAddresses { get; set; } = new();
    public List<DateTemplate> Dates { get; set; } = new();
}
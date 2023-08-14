using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class DivisionTemplate
{
    public List<List<string>> SharedAddresses { get; set; } = new();
    public List<DateTemplate> Dates { get; set; } = new();
}
using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class AnalysisResponseDto
{
    public Dictionary<string, KeyValuePair<int, int>[]> MostFrequent10Throws { get; set; } = new();
}

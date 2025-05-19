using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class AnalysisResponseDto
{
    public Dictionary<string, KeyValuePair<int, int>[]> MostFrequentThrows { get; set; } = new();
    public Dictionary<string, KeyValuePair<string, int>[]> MostFrequentPlayers { get; set; } = new();
}

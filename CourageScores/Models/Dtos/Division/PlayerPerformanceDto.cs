using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class PlayerPerformanceDto
{
    public int MatchesPlayed { get; set; }
    public int MatchesWon { get; set; }
    public int MatchesLost { get; set; }
    public int WinRate { get; set; }
    public int LossRate { get; set; }

    [JsonIgnore]
    public int TeamWinRate { get; set; }
    [JsonIgnore]
    public int TeamLossRate { get; set; }
}
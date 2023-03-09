using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;

namespace CourageScores.Models.Adapters.Game.Sayg;

[ExcludeFromCodeCoverage]
public class LegCompetitorScoreAdapterContext
{
    public int StartingScore { get; }
    public LegCompetitorScore Score { get; }

    public LegCompetitorScoreAdapterContext(int startingScore, LegCompetitorScore score)
    {
        StartingScore = startingScore;
        Score = score;
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Services.Analysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

/// <summary>
/// The details of a leg
/// </summary>
[ExcludeFromCodeCoverage]
public class LegDto
{
    /// <summary>
    /// The starting score for the leg
    /// </summary>
    public int StartingScore { get; set; }

    /// <summary>
    /// Who is playing from the home 'side'
    /// </summary>
    public LegCompetitorScoreDto Home { get; set; } = null!;

    /// <summary>
    /// Who is playing from the away 'side'
    /// </summary>
    public LegCompetitorScoreDto Away { get; set; } = null!;

    /// <summary>
    /// The sequence of players, e.g. home then away or the reverse
    /// </summary>
    public List<LegPlayerSequenceDto> PlayerSequence { get; set; } = new();

    /// <summary>
    /// The player that is/should throw now
    /// </summary>
    public string? CurrentThrow { get; set; }

    /// <summary>
    /// Is this the last leg of the match?
    /// </summary>
    public bool IsLastLeg { get; set; }

    public async Task<CompetitorType?> Accept(int legIndex, SaygMatchVisitorContext context, ISaygVisitor visitor, CancellationToken token)
    {
        await visitor.VisitLeg(legIndex, this);

        var scores = new Dictionary<CompetitorType, int>
        {
            {CompetitorType.Home, 0},
            {CompetitorType.Away, 0},
        };
        var players = PlayerSequence
            .Select(ps => Enum.TryParse<CompetitorType>(ps.Value, true, out var competitorType)
                ? competitorType
                : (CompetitorType?)null)
            .OfType<CompetitorType>() // exclude any null values
            .ToArray();

        var maxThrows = Math.Max(Home.Throws.Count, Away.Throws.Count);
        for (var index = 0; index < maxThrows; index++)
        {
            foreach (var player in players)
            {
                if (token.IsCancellationRequested)
                {
                    return null;
                }

                var competitor = player == CompetitorType.Home ? Home : Away;
                var teamPlayer = player == CompetitorType.Home ? context.HomePlayer : context.AwayPlayer;
                if (index >= competitor.Throws.Count)
                {
                    break;
                }

                var thr = competitor.Throws[index];
                var newScore = scores[player] + thr.Score;
                var isBust = newScore > StartingScore || newScore == StartingScore - 1;
                if (!isBust)
                {
                    scores[player] += thr.Score;
                }

                if (scores[player] == StartingScore)
                {
                    await visitor.VisitCheckout(teamPlayer, index, thr);
                    return player;
                }

                if (isBust)
                {
                    await visitor.VisitBust(teamPlayer, index, thr);
                }
                else
                {
                    await visitor.VisitThrow(teamPlayer, index, thr);
                }
            }
        }

        return null;
    }
}

using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Services.Analysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

[ExcludeFromCodeCoverage]
public class RecordedScoreAsYouGoDto : AuditedDto, IScoreAsYouGoDto
{
    /// <summary>
    /// Your name
    /// </summary>
    public string YourName { get; set; } = null!;

    /// <summary>
    /// An optional opponent name
    /// </summary>
    public string? OpponentName { get; set; }

    /// <summary>
    /// The number of legs
    /// </summary>
    public int NumberOfLegs { get; set; }

    /// <summary>
    /// The starting score
    /// </summary>
    public int StartingScore { get; set; }

    /// <summary>
    /// Your score
    /// </summary>
    public int HomeScore { get; set; }

    /// <summary>
    /// Opponent score, if applicable
    /// </summary>
    public int? AwayScore { get; set; }

    public Guid? TournamentMatchId { get; set; }

    /// <summary>
    ///     The legs for the match
    /// </summary>
    public Dictionary<int, LegDto> Legs { get; set; } = new();

    public async Task Accept(ISaygVisitor visitor, SaygMatchVisitorContext context, CancellationToken token)
    {
        await visitor.VisitMatch(this, context, token);
        await visitor.VisitMatchOptions(StartingScore, NumberOfLegs, token);

        foreach (var leg in Legs)
        {
            if (token.IsCancellationRequested)
            {
                return;
            }

            var winner = await leg.Value.Accept(leg.Key, context, visitor, token);

            if (leg.Key == NumberOfLegs - 1)
            {
                await visitor.VisitDeciderLeg(leg.Value, token);
            }

            var homeRemaining = leg.Value.StartingScore - leg.Value.Home.Throws.Sum(thr => thr.Score);
            var awayRemaining = leg.Value.StartingScore - leg.Value.Away.Throws.Sum(thr => thr.Score);
            if (winner == CompetitorType.Home)
            {
                await visitor.VisitWinner(context.HomePlayer, awayRemaining, token);
                await visitor.VisitLoser(context.AwayPlayer, awayRemaining, token);
            }
            else if (winner == CompetitorType.Away)
            {
                await visitor.VisitWinner(context.AwayPlayer, homeRemaining, token);
                await visitor.VisitLoser(context.HomePlayer, homeRemaining, token);
            }
        }
    }
}

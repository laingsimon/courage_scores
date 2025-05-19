using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

[ExcludeFromCodeCoverage]
public class CompositeSaygVisitor : ISaygVisitor
{
    private readonly ISaygVisitor[] _visitors;

    public CompositeSaygVisitor(params ISaygVisitor[] visitors)
    {
        _visitors = visitors;
    }

    public async Task VisitMatch(RecordedScoreAsYouGoDto recordedScoreAsYouGo, SaygMatchVisitorContext matchContext, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitMatch(recordedScoreAsYouGo, matchContext, token), token);
    }

    public async Task VisitLeg(int legIndex, LegDto leg, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitLeg(legIndex, leg, token), token);
    }

    public async Task VisitMatchOptions(int startingScore, int numberOfLegs, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitMatchOptions(startingScore, numberOfLegs, token), token);
    }

    public async Task VisitThrow(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitThrow(player, index, thr, token), token);
    }

    public async Task VisitDeciderLeg(LegDto leg, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitDeciderLeg(leg, token), token);
    }

    public async Task VisitCheckout(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitCheckout(player, index, thr, token), token);
    }

    public async Task VisitBust(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitBust(player, index, thr, token), token);
    }

    public async Task VisitWinner(SaygTeamPlayer player, int opponentRemaining, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitWinner(player, opponentRemaining, token), token);
    }

    public async Task VisitLoser(SaygTeamPlayer player, int remaining, CancellationToken token)
    {
        await ForEachVisitor(v => v.VisitLoser(player, remaining, token), token);
    }

    public void Finished(AnalysisResponseDto response)
    {
        foreach (var visitor in _visitors)
        {
            visitor.Finished(response);
        }
    }

    private async Task ForEachVisitor(Func<ISaygVisitor, Task> action, CancellationToken token)
    {
        foreach (var visitor in _visitors)
        {
            if (token.IsCancellationRequested)
            {
                return;
            }

            await action(visitor);
        }
    }
}

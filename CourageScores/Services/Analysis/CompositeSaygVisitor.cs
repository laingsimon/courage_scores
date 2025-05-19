using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public class CompositeSaygVisitor : ISaygVisitor
{
    private readonly ISaygVisitor[] _visitors;

    public CompositeSaygVisitor(params ISaygVisitor[] visitors)
    {
        _visitors = visitors;
    }

    public async Task VisitMatch(RecordedScoreAsYouGoDto recordedScoreAsYouGo, SaygMatchVisitorContext matchContext)
    {
        await ForEachVisitor(v => v.VisitMatch(recordedScoreAsYouGo, matchContext), CancellationToken.None);
    }

    public async Task VisitLeg(int legIndex, LegDto leg)
    {
        await ForEachVisitor(v => v.VisitLeg(legIndex, leg), CancellationToken.None);
    }

    public async Task VisitMatchOptions(int startingScore, int numberOfLegs)
    {
        await ForEachVisitor(v => v.VisitMatchOptions(startingScore, numberOfLegs), CancellationToken.None);
    }

    public async Task VisitThrow(SaygTeamPlayer player, int index, LegThrowDto thr)
    {
        await ForEachVisitor(v => v.VisitThrow(player, index, thr), CancellationToken.None);
    }

    public async Task VisitDeciderLeg(LegDto leg)
    {
        await ForEachVisitor(v => v.VisitDeciderLeg(leg), CancellationToken.None);
    }

    public async Task VisitCheckout(SaygTeamPlayer player, int index, LegThrowDto thr)
    {
        await ForEachVisitor(v => v.VisitCheckout(player, index, thr), CancellationToken.None);
    }

    public async Task VisitBust(SaygTeamPlayer player, int index, LegThrowDto thr)
    {
        await ForEachVisitor(v => v.VisitBust(player, index, thr), CancellationToken.None);
    }

    public async Task VisitWinner(SaygTeamPlayer player, int opponentRemaining)
    {
        await ForEachVisitor(v => v.VisitWinner(player, opponentRemaining), CancellationToken.None);
    }

    public async Task VisitLoser(SaygTeamPlayer player, int remaining)
    {
        await ForEachVisitor(v => v.VisitLoser(player, remaining), CancellationToken.None);
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

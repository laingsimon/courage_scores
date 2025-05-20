using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public interface ISaygVisitor
{
    [ExcludeFromCodeCoverage]
    Task VisitMatch(RecordedScoreAsYouGoDto recordedScoreAsYouGo, SaygMatchVisitorContext matchContext, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitLeg(int legIndex, LegDto leg, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitMatchOptions(int startingScore, int numberOfLegs, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitThrow(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitDeciderLeg(LegDto leg, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitCheckout(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitBust(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitWinner(SaygTeamPlayer player, int opponentRemaining, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitLoser(SaygTeamPlayer player, int remaining, CancellationToken token)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    void Finished(AnalysisResponseDto response)
    {

    }
}

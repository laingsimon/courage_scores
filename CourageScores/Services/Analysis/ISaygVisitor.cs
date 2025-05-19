using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public interface ISaygVisitor
{
    [ExcludeFromCodeCoverage]
    Task VisitMatch(RecordedScoreAsYouGoDto recordedScoreAsYouGo, SaygMatchVisitorContext matchContext)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitLeg(int legIndex, LegDto leg)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitMatchOptions(int startingScore, int numberOfLegs)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitThrow(SaygTeamPlayer player, int index, LegThrowDto thr)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitDeciderLeg(LegDto leg)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitCheckout(SaygTeamPlayer player, int index, LegThrowDto thr)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitBust(SaygTeamPlayer player, int index, LegThrowDto thr)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitWinner(SaygTeamPlayer player, int opponentRemaining)
    {
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    Task VisitLoser(SaygTeamPlayer player, int remaining)
    {
        return Task.CompletedTask;
    }
}

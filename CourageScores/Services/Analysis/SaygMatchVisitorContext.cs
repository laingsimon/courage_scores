using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Analysis;

[ExcludeFromCodeCoverage]
public class SaygMatchVisitorContext
{
    public SaygTeamPlayer HomePlayer { get; }
    public SaygTeamPlayer AwayPlayer { get; }

    public SaygMatchVisitorContext(SaygTeamPlayer homePlayer, SaygTeamPlayer awayPlayer)
    {
        HomePlayer = homePlayer;
        AwayPlayer = awayPlayer;
    }
}
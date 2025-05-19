using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Analysis;

[ExcludeFromCodeCoverage]
public class SaygFixtureVisitorContext
{
    public string? Home { get; }
    public string? Away { get; }

    public SaygFixtureVisitorContext(string? home, string? away)
    {
        Home = home;
        Away = away;
    }
}
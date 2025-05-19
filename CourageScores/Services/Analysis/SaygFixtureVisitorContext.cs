namespace CourageScores.Services.Analysis;

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

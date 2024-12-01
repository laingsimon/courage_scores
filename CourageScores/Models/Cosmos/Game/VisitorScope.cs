namespace CourageScores.Models.Cosmos.Game;

public class VisitorScope : IVisitorScope
{
    public Game? Game { get; init; }
    public TournamentGame? Tournament { get; init; }
    public bool ObscureScores { get; init; }

    public IVisitorScope With(IVisitorScope visitorScope)
    {
        return new VisitorScope
        {
            Game = visitorScope.Game ?? Game,
            Tournament = visitorScope.Tournament ?? Tournament,
            ObscureScores = ObscureScores || visitorScope.ObscureScores,
        };
    }
}
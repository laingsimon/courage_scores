namespace CourageScores.Models.Cosmos.Game;

public interface IVisitorScope
{
    Game? Game { get; }
    TournamentGame? Tournament { get; }
    bool ObscureScores { get; }
    IVisitorScope With(IVisitorScope visitorScope);
}
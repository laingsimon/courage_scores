namespace CourageScores.Models.Cosmos.Game;

public interface IVisitorScope
{
    Game? Game { get; }
    TournamentGame? Tournament { get; }
    bool ObscureScores { get; }
    int? Index { get; }
    IVisitorScope With(IVisitorScope visitorScope);
}
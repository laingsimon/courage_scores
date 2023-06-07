namespace CourageScores.Models.Cosmos.Game;

public interface IVisitorScope
{
    Game? Game { get; init; }
    TournamentGame? Tournament { get; init; }
    IVisitorScope With(IVisitorScope visitorScope);
}
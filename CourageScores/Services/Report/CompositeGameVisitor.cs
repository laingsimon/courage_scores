using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Report;

[ExcludeFromCodeCoverage]
public class CompositeGameVisitor : IGameVisitor
{
    private readonly bool _canAccessManOfTheMatch;
    private readonly IGameVisitor[] _underlyingVisitors;

    public CompositeGameVisitor(IEnumerable<IGameVisitor> underlyingVisitors, bool canAccessManOfTheMatch)
    {
        _canAccessManOfTheMatch = canAccessManOfTheMatch;
        _underlyingVisitors = underlyingVisitors.ToArray();
    }

    public void VisitGame(Models.Cosmos.Game.Game game)
    {
        ForEachVisitor(visitor => visitor.VisitGame(game));
    }

    public void VisitMatch(IVisitorScope scope, GameMatch match)
    {
        ForEachVisitor(visitor => visitor.VisitMatch(scope, match));
    }

    public void VisitMatchWin(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
        ForEachVisitor(visitor => visitor.VisitMatchWin(scope, players, team, winningScore, losingScore));
    }

    public void VisitMatchLost(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore,
        int winningScore)
    {
        ForEachVisitor(visitor => visitor.VisitMatchLost(scope, players, team, losingScore, winningScore));
    }

    public void VisitOneEighty(IVisitorScope scope, IGamePlayer player)
    {
        ForEachVisitor(visitor => visitor.VisitOneEighty(scope, player));
    }

    public void VisitHiCheckout(IVisitorScope scope, INotablePlayer player)
    {
        ForEachVisitor(visitor => visitor.VisitHiCheckout(scope, player));
    }

    public void VisitTeam(IVisitorScope scope, GameTeam team, GameState gameState)
    {
        ForEachVisitor(visitor => visitor.VisitTeam(scope, team, gameState));
    }

    public void VisitManOfTheMatch(IVisitorScope scope, Guid? manOfTheMatch)
    {
        if (_canAccessManOfTheMatch)
        {
            ForEachVisitor(visitor => visitor.VisitManOfTheMatch(scope, manOfTheMatch));
        }
    }

    public void VisitPlayer(IVisitorScope scope, GamePlayer player, int matchPlayerCount)
    {
        ForEachVisitor(visitor => visitor.VisitPlayer(scope, player, matchPlayerCount));
    }

    public void VisitTournamentPlayer(IVisitorScope scope, TournamentPlayer player)
    {
        ForEachVisitor(visitor => visitor.VisitTournamentPlayer(scope, player));
    }

    public void VisitGameDraw(IVisitorScope scope, GameTeam home, GameTeam away)
    {
        ForEachVisitor(visitor => visitor.VisitGameDraw(scope, home, away));
    }

    public void VisitGameWinner(IVisitorScope scope, GameTeam team)
    {
        ForEachVisitor(visitor => visitor.VisitGameWinner(scope, team));
    }

    public void VisitGameLoser(IVisitorScope scope, GameTeam team)
    {
        ForEachVisitor(visitor => visitor.VisitGameLoser(scope, team));
    }

    public void VisitDataError(IVisitorScope scope, string dataError)
    {
        ForEachVisitor(visitor => visitor.VisitDataError(scope, dataError));
    }

    private void ForEachVisitor(Action<IGameVisitor> action)
    {
        foreach (var visitor in _underlyingVisitors)
        {
            action(visitor);
        }
    }
}
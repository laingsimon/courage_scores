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

    private void ForEachVisitor(Action<IGameVisitor> action)
    {
        foreach (var visitor in _underlyingVisitors)
        {
            action(visitor);
        }
    }

    public void VisitGame(Models.Cosmos.Game.Game game)
    {
        ForEachVisitor(visitor => visitor.VisitGame(game));
    }

    public void VisitMatch(GameMatch match)
    {
        ForEachVisitor(visitor => visitor.VisitMatch(match));
    }

    public void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winBy)
    {
        ForEachVisitor(visitor => visitor.VisitMatchWin(players, team, winBy));
    }

    public void VisitMatchDraw(IReadOnlyCollection<GamePlayer> homePlayers, IReadOnlyCollection<GamePlayer> awayPlayers, int score)
    {
        ForEachVisitor(visitor => visitor.VisitMatchDraw(homePlayers, awayPlayers, score));
    }

    public void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int lossBy)
    {
        ForEachVisitor(visitor => visitor.VisitMatchLost(players, team, lossBy));
    }

    public void VisitOneEighty(IGamePlayer player)
    {
        ForEachVisitor(visitor => visitor.VisitOneEighty(player));
    }

    public void VisitHiCheckout(NotablePlayer player)
    {
        ForEachVisitor(visitor => visitor.VisitHiCheckout(player));
    }

    public void VisitTeam(GameTeam team, GameState gameState)
    {
        ForEachVisitor(visitor => visitor.VisitTeam(team, gameState));
    }

    public void VisitManOfTheMatch(Guid? manOfTheMatch)
    {
        if (_canAccessManOfTheMatch)
        {
            ForEachVisitor(visitor => visitor.VisitManOfTheMatch(manOfTheMatch));
        }
    }

    public void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
        ForEachVisitor(visitor => visitor.VisitPlayer(player, matchPlayerCount));
    }

    public void VisitTournamentPlayer(TournamentPlayer player)
    {
        ForEachVisitor(visitor => visitor.VisitTournamentPlayer(player));
    }

    public void VisitGameDraw(GameTeam home, GameTeam away)
    {
        ForEachVisitor(visitor => visitor.VisitGameDraw(home, away));
    }

    public void VisitGameWinner(GameTeam team)
    {
        ForEachVisitor(visitor => visitor.VisitGameWinner(team));
    }

    public void VisitGameLost(GameTeam team)
    {
        ForEachVisitor(visitor => visitor.VisitGameLost(team));
    }
}
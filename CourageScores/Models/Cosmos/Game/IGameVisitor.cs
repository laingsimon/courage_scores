using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

public interface IGameVisitor
{
    [ExcludeFromCodeCoverage]
    void VisitGame(Game game)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatch(IVisitorScope scope, GameMatch match)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatchWin(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatchLost(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitOneEighty(IVisitorScope scope, IGamePlayer player)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitHiCheckout(IVisitorScope scope, INotablePlayer player)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitTeam(IVisitorScope scope, GameTeam team, GameState gameState)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitManOfTheMatch(IVisitorScope scope, Guid? manOfTheMatch)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitPlayer(IVisitorScope scope, GamePlayer player, int matchPlayerCount)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitTournamentPlayer(IVisitorScope scope, TournamentPlayer player)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGameDraw(IVisitorScope scope, GameTeam home, GameTeam away)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGameWinner(IVisitorScope scope, GameTeam team)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGameLoser(IVisitorScope scope, GameTeam team)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGame(TournamentGame tournamentGame)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitRound(IVisitorScope scope, TournamentRound tournamentRound)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitFinal(IVisitorScope scope, TournamentMatch match)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitTournamentWinner(IVisitorScope scope, TournamentSide side)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatch(IVisitorScope scope, TournamentMatch match)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitSide(IVisitorScope scope, TournamentSide tournamentSide)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitDataError(IVisitorScope scope, string dataError)
    {
    }
}
using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

public interface IGameVisitor
{
    [ExcludeFromCodeCoverage]
    void VisitGame(Game game)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatch(GameMatch match)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitOneEighty(IGamePlayer player)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitHiCheckout(INotablePlayer player)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitTeam(GameTeam team, GameState gameState)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitManOfTheMatch(Guid? manOfTheMatch)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitTournamentPlayer(TournamentPlayer player)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGameDraw(GameTeam home, GameTeam away)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGameWinner(GameTeam team)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGameLoser(GameTeam team)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitGame(TournamentGame tournamentGame)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitRound(TournamentRound tournamentRound)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitFinal(TournamentMatch match)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitTournamentWinner(TournamentSide side)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitMatch(TournamentMatch match)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitSide(TournamentSide tournamentSide)
    {
    }

    [ExcludeFromCodeCoverage]
    void VisitDataError(string dataError)
    {
    }
}
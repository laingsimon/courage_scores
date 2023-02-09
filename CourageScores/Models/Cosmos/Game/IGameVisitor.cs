namespace CourageScores.Models.Cosmos.Game;

public interface IGameVisitor
{
    void VisitGame(Game game)
    {
    }

    void VisitMatch(GameMatch match)
    {
    }

    void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
    }

    void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
    }

    void VisitOneEighty(IGamePlayer player)
    {
    }

    void VisitHiCheckout(INotablePlayer player)
    {
    }

    void VisitTeam(GameTeam team, GameState gameState)
    {
    }

    void VisitManOfTheMatch(Guid? manOfTheMatch)
    {
    }

    void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
    }

    void VisitTournamentPlayer(TournamentPlayer player)
    {
    }

    void VisitGameDraw(GameTeam home, GameTeam away)
    {
    }

    void VisitGameWinner(GameTeam team)
    {
    }

    void VisitGameLost(GameTeam team)
    {
    }

    void VisitGame(TournamentGame tournamentGame)
    {
    }

    void VisitRound(TournamentRound tournamentRound)
    {
    }

    void VisitFinal(TournamentMatch match)
    {
    }

    void VisitTournamentWinner(TournamentSide side)
    {
    }

    void VisitMatch(TournamentMatch match)
    {
    }

    void VisitSide(TournamentSide tournamentSide)
    {
    }
}
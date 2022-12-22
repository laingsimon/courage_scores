using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

[SuppressMessage("ReSharper", "UnusedParameter.Global")]
public interface IGameVisitor
{
    void VisitGame(Game game)
    {
    }

    void VisitMatch(GameMatch match)
    {
    }

    void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team)
    {
    }

    void VisitMatchDraw(IReadOnlyCollection<GamePlayer> homePlayers, IReadOnlyCollection<GamePlayer> awayPlayers)
    {
    }

    void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team)
    {
    }

    void VisitOneEighty(GamePlayer player)
    {
    }

    void VisitHiCheckout(NotablePlayer player)
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

    void VisitGameDraw(GameTeam home, GameTeam away)
    {
    }

    void VisitGameWinner(GameTeam team)
    {
    }

    void VisitGameLost(GameTeam team)
    {
    }

    void VisitTournamentGame(TournamentGame tournamentGame)
    {
    }

    void VisitTournamentRound(TournamentRound tournamentRound)
    {
    }

    void VisitTournamentFinal(TournamentMatch match)
    {
    }

    void VisitTournamentWinner(TournamentSide side)
    {
    }

    void VisitTournamentMatch(TournamentMatch match)
    {
    }
}
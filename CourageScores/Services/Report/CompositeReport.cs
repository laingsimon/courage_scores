using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

[ExcludeFromCodeCoverage]
public abstract class CompositeReport : IReport
{
    private readonly IReadOnlyCollection<IReport> _reports;

    protected CompositeReport(IEnumerable<IReport> reports)
    {
        _reports = reports.ToArray();
    }

    public abstract Task<ReportDto> GetReport(IPlayerLookup playerLookup, CancellationToken token);

    private void ForEachReport(Action<IReport> action)
    {
        foreach (var report in _reports)
        {
            action(report);
        }
    }

    public void VisitGame(Models.Cosmos.Game.Game game)
    {
        ForEachReport(r => r.VisitGame(game));
    }

    public void VisitMatch(IVisitorScope scope, GameMatch match)
    {
        ForEachReport(r => r.VisitMatch(scope, match));
    }

    public void VisitMatchWin(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
        ForEachReport(r => r.VisitMatchWin(scope, players, team, winningScore, losingScore));
    }

    public void VisitMatchLost(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
        ForEachReport(r => r.VisitMatchLost(scope, players, team, losingScore, winningScore));
    }

    public void VisitOneEighty(IVisitorScope scope, IGamePlayer player)
    {
        ForEachReport(r => r.VisitOneEighty(scope, player));
    }

    public void VisitHiCheckout(IVisitorScope scope, INotablePlayer player)
    {
        ForEachReport(r => r.VisitHiCheckout(scope, player));
    }

    public void VisitTeam(IVisitorScope scope, GameTeam team, GameState gameState)
    {
        ForEachReport(r => r.VisitTeam(scope, team, gameState));
    }

    public void VisitManOfTheMatch(IVisitorScope scope, Guid? manOfTheMatch)
    {
        ForEachReport(r => r.VisitManOfTheMatch(scope, manOfTheMatch));
    }

    public void VisitPlayer(IVisitorScope scope, GamePlayer player, int matchPlayerCount)
    {
        ForEachReport(r => r.VisitPlayer(scope, player, matchPlayerCount));
    }

    public void VisitTournamentPlayer(IVisitorScope scope, TournamentPlayer player)
    {
        ForEachReport(r => r.VisitTournamentPlayer(scope, player));
    }

    public void VisitGameDraw(IVisitorScope scope, GameTeam home, GameTeam away)
    {
        ForEachReport(r => r.VisitGameDraw(scope, home, away));
    }

    public void VisitGameWinner(IVisitorScope scope, GameTeam team)
    {
        ForEachReport(r => r.VisitGameWinner(scope, team));
    }

    public void VisitGameLoser(IVisitorScope scope, GameTeam team)
    {
        ForEachReport(r => r.VisitGameLoser(scope, team));
    }

    public void VisitGame(TournamentGame tournamentGame)
    {
        ForEachReport(r => r.VisitGame(tournamentGame));
    }

    public void VisitRound(IVisitorScope scope, TournamentRound tournamentRound)
    {
        ForEachReport(r => r.VisitRound(scope, tournamentRound));
    }

    public void VisitFinal(IVisitorScope scope, TournamentMatch match)
    {
        ForEachReport(r => r.VisitFinal(scope, match));
    }

    public void VisitTournamentWinner(IVisitorScope scope, TournamentSide side)
    {
        ForEachReport(r => r.VisitTournamentWinner(scope, side));
    }

    public void VisitMatch(IVisitorScope scope, TournamentMatch match)
    {
        ForEachReport(r => r.VisitMatch(scope, match));
    }

    public void VisitSide(IVisitorScope scope, TournamentSide tournamentSide)
    {
        ForEachReport(r => r.VisitSide(scope, tournamentSide));
    }

    public void VisitDataError(IVisitorScope scope, string dataError)
    {
        ForEachReport(r => r.VisitDataError(scope, dataError));
    }
}
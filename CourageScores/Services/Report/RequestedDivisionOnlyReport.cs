using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class RequestedDivisionOnlyReport : IReport
{
    private readonly IReport _report;
    private readonly Guid _requestedDivisionId;
    private Models.Cosmos.Game.Game? _currentGame;
    private TournamentGame? _currentTournament;

    public RequestedDivisionOnlyReport(IReport report, Guid requestedDivisionId)
    {
        _report = report;
        _requestedDivisionId = requestedDivisionId;
    }

    private bool IsForRequestedDivision()
    {
        if (_currentGame != null)
        {
            return _currentGame.DivisionId == _requestedDivisionId || _currentGame.IsKnockout;
        }

        if (_currentTournament != null)
        {
            return _currentTournament.DivisionId == _requestedDivisionId || _currentTournament.DivisionId == null;
        }

        return false;
    }

    public async Task<ReportDto> GetReport(ReportRequestDto request, IPlayerLookup playerLookup, CancellationToken token)
    {
        var report = await _report.GetReport(request, playerLookup, token);
        report.ThisDivisionOnly = true;
        return report;
    }

    public void VisitGame(Models.Cosmos.Game.Game game)
    {
        _currentGame = game;
        _currentTournament = null;
        if (IsForRequestedDivision())
        {
            _report.VisitGame(game);
        }
    }

    public void VisitMatch(IVisitorScope scope, GameMatch match)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatch(scope, match);
        }
    }

    public void VisitMatchWin(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatchWin(scope, players, team, winningScore, losingScore);
        }
    }

    public void VisitMatchLost(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatchLost(scope, players, team, losingScore, winningScore);
        }
    }

    public void VisitOneEighty(IVisitorScope scope, IGamePlayer player)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitOneEighty(scope, player);
        }
    }

    public void VisitHiCheckout(IVisitorScope scope, INotablePlayer player)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitHiCheckout(scope, player);
        }
    }

    public void VisitTeam(IVisitorScope scope, GameTeam team, GameState gameState)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitTeam(scope, team, gameState);
        }
    }

    public void VisitManOfTheMatch(IVisitorScope scope, Guid? manOfTheMatch)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitManOfTheMatch(scope, manOfTheMatch);
        }
    }

    public void VisitPlayer(IVisitorScope scope, GamePlayer player, int matchPlayerCount)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitPlayer(scope, player, matchPlayerCount);
        }
    }

    public void VisitTournamentPlayer(IVisitorScope scope, TournamentPlayer player)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitTournamentPlayer(scope, player);
        }
    }

    public void VisitGameDraw(IVisitorScope scope, GameTeam home, GameTeam away)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitGameDraw(scope, home, away);
        }
    }

    public void VisitGameWinner(IVisitorScope scope, GameTeam team)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitGameWinner(scope, team);
        }
    }

    public void VisitGameLoser(IVisitorScope scope, GameTeam team)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitGameLoser(scope, team);
        }
    }

    public void VisitGame(TournamentGame tournamentGame)
    {
        _currentGame = null;
        _currentTournament = tournamentGame;
        if (IsForRequestedDivision())
        {
            _report.VisitGame(tournamentGame);
        }
    }

    public void VisitRound(IVisitorScope scope, TournamentRound tournamentRound)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitRound(scope, tournamentRound);
        }
    }

    public void VisitFinal(IVisitorScope scope, TournamentMatch match)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitFinal(scope, match);
        }
    }

    public void VisitTournamentWinner(IVisitorScope scope, TournamentSide side)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitTournamentWinner(scope, side);
        }
    }

    public void VisitMatch(IVisitorScope scope, TournamentMatch match)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatch(scope, match);
        }
    }

    public void VisitSide(IVisitorScope scope, TournamentSide tournamentSide)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitSide(scope, tournamentSide);
        }
    }

    public void VisitDataError(IVisitorScope scope, string dataError)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitDataError(scope, dataError);
        }
    }
}
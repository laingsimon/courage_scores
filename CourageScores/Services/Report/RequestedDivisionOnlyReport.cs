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
        return (_currentGame != null && _currentGame.DivisionId == _requestedDivisionId)
            || (_currentTournament != null && (_currentTournament.DivisionId == _requestedDivisionId || _currentTournament.DivisionId == null));
    }

    public Task<ReportDto> GetReport(IPlayerLookup playerLookup)
    {
        return _report.GetReport(playerLookup);
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

    public void VisitMatch(GameMatch match)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatch(match);
        }
    }

    public void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatchWin(players, team, winningScore, losingScore);
        }
    }

    public void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatchLost(players, team, losingScore, winningScore);
        }
    }

    public void VisitOneEighty(IGamePlayer player)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitOneEighty(player);
        }
    }

    public void VisitHiCheckout(INotablePlayer player)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitHiCheckout(player);
        }
    }

    public void VisitTeam(GameTeam team, GameState gameState)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitTeam(team, gameState);
        }
    }

    public void VisitManOfTheMatch(Guid? manOfTheMatch)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitManOfTheMatch(manOfTheMatch);
        }
    }

    public void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitPlayer(player, matchPlayerCount);
        }
    }

    public void VisitTournamentPlayer(TournamentPlayer player)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitTournamentPlayer(player);
        }
    }

    public void VisitGameDraw(GameTeam home, GameTeam away)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitGameDraw(home, away);
        }
    }

    public void VisitGameWinner(GameTeam team)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitGameWinner(team);
        }
    }

    public void VisitGameLoser(GameTeam team)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitGameLoser(team);
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

    public void VisitRound(TournamentRound tournamentRound)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitRound(tournamentRound);
        }
    }

    public void VisitFinal(TournamentMatch match)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitFinal(match);
        }
    }

    public void VisitTournamentWinner(TournamentSide side)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitTournamentWinner(side);
        }
    }

    public void VisitMatch(TournamentMatch match)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitMatch(match);
        }
    }

    public void VisitSide(TournamentSide tournamentSide)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitSide(tournamentSide);
        }
    }

    public void VisitDataError(string dataError)
    {
        if (IsForRequestedDivision())
        {
            _report.VisitDataError(dataError);
        }
    }
}
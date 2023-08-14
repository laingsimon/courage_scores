using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Report;
using CourageScores.Repository;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Report;

public class ReportService : IReportService
{
    private readonly IUserService _userService;
    private readonly ISeasonService _seasonService;
    private readonly IDivisionService _divisionService;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly IGenericRepository<TournamentGame> _tournamentRepository;
    private readonly ISystemClock _clock;

    public ReportService(
        IUserService userService,
        ISeasonService seasonService,
        IDivisionService divisionService,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository,
        IGenericRepository<TournamentGame> tournamentRepository,
        ISystemClock clock)
    {
        _userService = userService;
        _seasonService = seasonService;
        _divisionService = divisionService;
        _gameRepository = gameRepository;
        _tournamentRepository = tournamentRepository;
        _clock = clock;
    }

    public async Task<ReportCollectionDto> GetReports(ReportRequestDto request, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access == null || !user.Access.RunReports)
        {
            return UnableToProduceReport("Not permitted", request);
        }

        var season = await _seasonService.Get(request.SeasonId, token);
        if (season == null)
        {
            return UnableToProduceReport("Season not found", request);
        }

        var division = await _divisionService.Get(request.DivisionId, token);
        if (division == null)
        {
            return UnableToProduceReport("Division not found", request);
        }

        var reportVisitors = GetReportVisitors(request, user).ToArray();
        var reportVisitor = new CompositeGameVisitor(reportVisitors, user.Access.ManageScores);
        var gameCount = 0;
        var playerLookup = new PlayerLookup();
        var visitorScope = new VisitorScope();

        await foreach (var game in _gameRepository.GetSome($"t.SeasonId = '{request.SeasonId}'", token))
        {
            gameCount++;
            game.Accept(visitorScope, playerLookup);
            game.Accept(visitorScope, reportVisitor);
        }

        await foreach (var tournament in _tournamentRepository.GetSome($"t.SeasonId = '{request.SeasonId}'", token))
        {
            gameCount++;
            tournament.Accept(visitorScope, playerLookup);
            tournament.Accept(visitorScope, reportVisitor);
        }

        return new ReportCollectionDto
        {
            DivisionId = request.DivisionId,
            SeasonId = request.SeasonId,
            Reports = await reportVisitors.SelectAsync(v => v.GetReport(playerLookup, token)).ToList(),
            Messages =
            {
                $"{gameCount} games inspected",
            },
            Created = _clock.UtcNow.UtcDateTime,
        };
    }

    private static IEnumerable<IReport> GetReportVisitors(ReportRequestDto request, UserDto user)
    {
        if (user.Access!.ManageScores)
        {
            yield return new ManOfTheMatchReport(request.TopCount);
        }

        yield return new RequestedDivisionOnlyReport(new MostPlayedPlayerReport(topCount: request.TopCount), request.DivisionId);
        yield return new RequestedDivisionOnlyReport(new MostOneEightiesReport(request.TopCount), request.DivisionId);
        yield return new RequestedDivisionOnlyReport(new HighestCheckoutReport(request.TopCount), request.DivisionId);
    }

    private ReportCollectionDto UnableToProduceReport(string reason, ReportRequestDto request)
    {
        return new ReportCollectionDto
        {
            DivisionId = request.DivisionId,
            SeasonId = request.SeasonId,
            Messages = { reason },
            Created = _clock.UtcNow.UtcDateTime,
        };
    }
}

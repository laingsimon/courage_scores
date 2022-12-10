using CourageScores.Models.Cosmos.Game;
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
    private readonly IGenericRepository<Game> _gameRepository;
    private readonly ISystemClock _clock;

    public ReportService(IUserService userService, ISeasonService seasonService, IDivisionService divisionService, IGenericRepository<Game> gameRepository, ISystemClock clock)
    {
        _userService = userService;
        _seasonService = seasonService;
        _divisionService = divisionService;
        _gameRepository = gameRepository;
        _clock = clock;
    }

    public async Task<ReportCollectionDto> GetReports(ReportRequestDto request, CancellationToken token)
    {
        var user = await _userService.GetUser();
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

        var reportVisitors = GetReportVisitors(request).ToArray();
        var reportVisitor = new CompositeGameVisitor(reportVisitors, user.Access.ManageScores);
        var games = _gameRepository.GetSome($"t.DivisionId = '{request.DivisionId}' and t.SeasonId = '{request.SeasonId}'", token);
        var gameCount = 0;
        var playerLookup = new PlayerLookup();

        await foreach (var game in games.WithCancellation(token))
        {
            gameCount++;
            game.Accept(playerLookup);
            game.Accept(reportVisitor);
        }

        return new ReportCollectionDto
        {
            DivisionId = request.DivisionId,
            SeasonId = request.SeasonId,
            Reports = await reportVisitors.SelectAsync(v => v.GetReport(playerLookup)).ToList(),
            Messages =
            {
                $"{gameCount} games inspected",
            },
            Created = _clock.UtcNow.UtcDateTime,
        };
    }

    private static IEnumerable<IReport> GetReportVisitors(ReportRequestDto request)
    {
        yield return new ManOfTheMatchReport();
        yield return new MostPlayedPlayerReport();
        yield return new MostOneEightiesReport();
        yield return new HighestCheckoutReport();
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

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

    public async Task<ReportCollectionDto> GetReports(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        var user = await _userService.GetUser();
        if (user?.Access == null || !user.Access.RunReports)
        {
            return UnableToProduceReport("Not permitted", divisionId, seasonId);
        }

        var season = await _seasonService.Get(seasonId, token);
        if (season == null)
        {
            return UnableToProduceReport("Season not found", divisionId, seasonId);
        }

        var division = await _divisionService.Get(divisionId, token);
        if (division == null)
        {
            return UnableToProduceReport("Division not found", divisionId, seasonId);
        }

        var reportVisitors = GetReportVisitors().ToArray();
        var reportVisitor = new CompositeGameVisitor(reportVisitors, user.Access.ManageScores);
        var games = _gameRepository.GetSome($"t.DivisionId = '{divisionId}' and t.SeasonId = '{seasonId}'", token);
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
            DivisionId = divisionId,
            SeasonId = seasonId,
            Reports = await reportVisitors.SelectAsync(v => v.GetReport(playerLookup)).ToList(),
            Messages =
            {
                $"{gameCount} games inspected",
            },
            Created = _clock.UtcNow.UtcDateTime,
        };
    }

    private static IEnumerable<IReport> GetReportVisitors()
    {
        yield return new ManOfTheMatchReport();
        yield return new MostPlayedPlayerReport();
    }

    private ReportCollectionDto UnableToProduceReport(string reason, Guid divisionId, Guid seasonId)
    {
        return new ReportCollectionDto
        {
            DivisionId = divisionId,
            SeasonId = seasonId,
            Messages = { reason },
            Created = _clock.UtcNow.UtcDateTime,
        };
    }
}
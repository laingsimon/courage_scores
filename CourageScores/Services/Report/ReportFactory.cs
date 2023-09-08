using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Report;

public class ReportFactory : IReportFactory
{
    private readonly IUserService _userService;
    private readonly ICachingDivisionService _divisionService;
    private readonly ICachingSeasonService _seasonService;
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _tournamentService;

    public ReportFactory(
        IUserService userService,
        ICachingDivisionService divisionService,
        ICachingSeasonService seasonService,
        IGenericDataService<TournamentGame, TournamentGameDto> tournamentService)
    {
        _userService = userService;
        _divisionService = divisionService;
        _seasonService = seasonService;
        _tournamentService = tournamentService;
    }

    public async IAsyncEnumerable<IReport> GetReports(ReportRequestDto request, [EnumeratorCancellation] CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        if (user?.Access?.ManageScores == true)
        {
            yield return new ManOfTheMatchReport(request.TopCount);
        }

        yield return new RequestedDivisionOnlyReport(new MostPlayedPlayerReport(topCount: request.TopCount), request.DivisionId);
        yield return new RequestedDivisionOnlyReport(new MostOneEightiesReport(request.TopCount), request.DivisionId);
        yield return new RequestedDivisionOnlyReport(new HighestCheckoutReport(request.TopCount), request.DivisionId);

        yield return new FinalsNightReport(
            _userService,
            new ManOfTheMatchReport(1),
            (await _seasonService.Get(request.SeasonId, token))!,
            _divisionService,
            _tournamentService);
    }
}
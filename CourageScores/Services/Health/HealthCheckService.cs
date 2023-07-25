using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;

namespace CourageScores.Services.Health;

public class HealthCheckService : IHealthCheckService
{
    private readonly IUserService _userService;
    private readonly ISeasonService _seasonService;
    private readonly IDivisionService _divisionService;
    private readonly ISeasonHealthCheckFactory _seasonHealthCheckFactory;
    private readonly ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto> _divisionAdapter;

    public HealthCheckService(
        IUserService userService,
        ISeasonService seasonService,
        IDivisionService divisionService,
        ISeasonHealthCheckFactory seasonHealthCheckFactory,
        ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto> divisionAdapter)
    {
        _userService = userService;
        _seasonService = seasonService;
        _divisionService = divisionService;
        _seasonHealthCheckFactory = seasonHealthCheckFactory;
        _divisionAdapter = divisionAdapter;
    }

    public async Task<SeasonHealthCheckResultDto> Check(Guid seasonId, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        if (user?.Access?.RunHealthChecks != true)
        {
            return new SeasonHealthCheckResultDto
            {
                Errors = { "Not permitted" },
            };
        }

        var season = await _seasonService.Get(seasonId, token);
        if (season == null)
        {
            return new SeasonHealthCheckResultDto
            {
                Errors = { "Season not found" },
            };
        }

        var divisionalData = await season.Divisions
            .SelectAsync(d => _divisionService.GetDivisionData(
                new DivisionDataFilter { DivisionId = d.Id, SeasonId = season.Id },
                token))
            .ToList();

        if (divisionalData.Count == 0)
        {
            return new SeasonHealthCheckResultDto
            {
                Warnings = { "No divisions" },
                Success = true,
            };
        }

        var result = new SeasonHealthCheckResultDto
        {
            Errors = divisionalData.SelectMany(d => d.DataErrors).ToList(),
            Success = divisionalData.Any(d => !d.DataErrors.Any()),
        };

        var checks = _seasonHealthCheckFactory.GetHealthChecks();
        var healthCheckData = await divisionalData.SelectAsync(d => _divisionAdapter.Adapt(d, token)).ToList();
        var context = new HealthCheckContext(season);

        foreach (var check in checks)
        {
            var checkResult = await check.RunCheck(healthCheckData, context);

            result.Checks.Add(check.Name, checkResult);
            result.Success = result.Success && checkResult.Success;
        }

        return result;
    }
}
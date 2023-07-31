using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
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
    private readonly ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto> _seasonAdapter;

    public HealthCheckService(
        IUserService userService,
        ISeasonService seasonService,
        IDivisionService divisionService,
        ISeasonHealthCheckFactory seasonHealthCheckFactory,
        ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto> seasonAdapter)
    {
        _userService = userService;
        _seasonService = seasonService;
        _divisionService = divisionService;
        _seasonHealthCheckFactory = seasonHealthCheckFactory;
        _seasonAdapter = seasonAdapter;
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

        var seasonHealthDto = await _seasonAdapter.Adapt(new SeasonHealthDtoAdapter.SeasonAndDivisions(season, divisionalData), token);

        var result = await Check(seasonHealthDto, token);
        result.Errors.InsertRange(0, divisionalData.SelectMany(d => d.DataErrors));
        result.Success = result.Success && result.Errors.Count == 0;

        return result;
    }

    public async Task<SeasonHealthCheckResultDto> Check(SeasonHealthDto season, CancellationToken token)
    {
        if (season.Divisions.Count == 0)
        {
            return new SeasonHealthCheckResultDto
            {
                Warnings = { "No divisions" },
                Success = true,
            };
        }

        var checks = _seasonHealthCheckFactory.GetHealthChecks();
        var context = new HealthCheckContext(season);
        var result = new SeasonHealthCheckResultDto { Success = true };

        foreach (var check in checks)
        {
            var checkResult = await check.RunCheck(context.Season.Divisions, context, token);

            result.Checks.Add(check.Name, checkResult);
            result.Success = result.Success && checkResult.Success;
        }

        return result;
    }
}
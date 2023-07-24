using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class FixturesBeforeEndDate : ISeasonHealthCheck
{
    public string Name => "All fixtures on or before end date";

    public Task<SeasonHealthCheckResult> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context)
    {
        return Task.FromResult(new SeasonHealthCheckResult
        {
            Success = divisions.All(d => d.Dates.All(f => f.Date <= context.Season.EndDate)),
        });
    }
}
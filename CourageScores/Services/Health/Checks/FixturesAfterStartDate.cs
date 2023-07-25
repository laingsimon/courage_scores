using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class FixturesAfterStartDate : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "All fixtures on or after start date";

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        return Task.FromResult(new HealthCheckResultDto
        {
            Success = divisions.All(d => d.Dates.All(f => f.Date >= context.Season.StartDate)),
        });
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class FixturesBeforeEndDate : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "All fixtures on or before end date";

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions,
        HealthCheckContext context, CancellationToken token)
    {
        var fixturesAfterEnd = divisions
            .SelectMany(d => d.Dates)
            .Select(d => d.Date)
            .Where(d => d > context.Season.EndDate)
            .Distinct()
            .ToArray();

        return Task.FromResult(new HealthCheckResultDto
        {
            Success = fixturesAfterEnd.Length == 0,
            Warnings = fixturesAfterEnd.Select(d => $"Fixture exists after season end date: {d:d MMM}").ToList(),
        });
    }
}
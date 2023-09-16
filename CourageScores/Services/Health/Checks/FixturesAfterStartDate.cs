using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class FixturesAfterStartDate : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "All fixtures on or after start date";

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        var fixturesBeforeStart = divisions
            .SelectMany(d => d.Dates)
            .Select(d => d.Date)
            .Where(d => d < context.Season.StartDate)
            .Distinct()
            .ToArray();

        return Task.FromResult(new HealthCheckResultDto
        {
            Success = fixturesBeforeStart.Length == 0,
            Warnings = fixturesBeforeStart.Select(d => $"Fixture exists before season start date: {d:d MMM}").ToList(),
        });
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class VenuesBeingUsedByMultipleTeamsOnSameDate : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "Venues do not have multiple fixtures on the same date";

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        var result = new HealthCheckResultDto
        {
            Success = true,
        };

        var allDates = divisions.SelectMany(d => d.Dates).Select(d => d.Date).ToHashSet();
        foreach (var date in allDates)
        {
            var fixturesPerDateAllDivisions = divisions
                .SelectMany(division => division.Dates.Where(d => d.Date == date).SelectMany(d => d.Fixtures))
                .ToArray();

            var multipleFixturesPerVenue = fixturesPerDateAllDivisions.GroupBy(f => f.HomeTeamAddress ?? f.HomeTeam).Where(g => g.Count() > 1);
            foreach (var group in multipleFixturesPerVenue)
            {
                result.Success = false;
                result.Warnings.Add($"{group.Key} is being used for {group.Count()} fixtures on {date:d MMM yyyy}");
            }
        }

        return Task.FromResult(result);
    }
}
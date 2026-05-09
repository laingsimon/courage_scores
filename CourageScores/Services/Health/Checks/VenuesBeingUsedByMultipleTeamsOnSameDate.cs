using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class VenuesBeingUsedByMultipleTeamsOnSameDate : ISeasonHealthCheck
{
    private readonly int _intervalDays;

    public VenuesBeingUsedByMultipleTeamsOnSameDate(int intervalDays = 7)
    {
        _intervalDays = intervalDays;
    }

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

            var multipleFixturesPerVenue = fixturesPerDateAllDivisions
                .Where(f => f.AwayTeamId != null) // exclude byes
                .GroupBy(f => f.HomeTeamAddress ?? f.HomeTeam)
                .Where(g => g.Count() > 1);

            foreach (var group in multipleFixturesPerVenue)
            {
                result.Success = false;
                result.Warnings.Add($"{group.Key} is being used for {group.Count()} fixtures on week {GetWeekNumber(date, allDates)}");
            }
        }

        return Task.FromResult(result);
    }

    private int GetWeekNumber(DateTime date, IReadOnlyCollection<DateTime> allDates)
    {
        var sinceStartOfSeason = date.Date.Subtract(allDates.Min());
        return (sinceStartOfSeason.Days / _intervalDays) + 1;
    }
}

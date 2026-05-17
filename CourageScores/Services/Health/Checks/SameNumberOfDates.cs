using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class SameNumberOfDates : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => $"All fixtures should have the same number of weeks";

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        try
        {
            if (divisions.Count <= 1)
            {
                return Task.FromResult(new HealthCheckResultDto { Success = true });
            }

            var numberOfWeeksRanked = divisions
                .GroupBy(division => division.Dates.Count)
                .ToDictionary(grouping => grouping.Key, grouping => grouping.ToArray());

            if (numberOfWeeksRanked.Count == 1)
            {
                return Task.FromResult(new HealthCheckResultDto { Success = true });
            }

            var mostCommonNumberOfWeeks = numberOfWeeksRanked.MaxBy(pair => pair.Value.Length).Key;
            var otherNumberOfWeeks = numberOfWeeksRanked.Where(pair => pair.Key != mostCommonNumberOfWeeks);
            var otherNumberOfWeeksDetails = otherNumberOfWeeks.Select(pair => $"{pair.Key} weeks in {string.Join(" & ", pair.Value.Select(division => division.Name))}");
            return Task.FromResult(new HealthCheckResultDto
            {
                Errors =
                [
                    $"Some divisions have a different number of weeks, expected: {mostCommonNumberOfWeeks} weeks, found {string.Join(", ", otherNumberOfWeeksDetails)}",
                ]
            });
        }
        catch (Exception exception)
        {
            return Task.FromException<HealthCheckResultDto>(exception);
        }
    }
}

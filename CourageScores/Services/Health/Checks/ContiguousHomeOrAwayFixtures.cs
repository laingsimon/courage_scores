using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class ContiguousHomeOrAwayFixtures : ISeasonHealthCheck
{
    private readonly int _maxContiguousEvents;
    private readonly int _intervalDays;

    public ContiguousHomeOrAwayFixtures(int maxContiguousEvents = 2, int intervalDays = 7)
    {
        _maxContiguousEvents = maxContiguousEvents;
        _intervalDays = intervalDays;
    }

    [ExcludeFromCodeCoverage]
    public string Name => "Not too many home or away games in succession";

    public async Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        return (await divisions.SelectAsync(division => RunDivisionCheck(division, context, token)).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    private async Task<HealthCheckResultDto> RunDivisionCheck(DivisionHealthDto division, HealthCheckContext context, CancellationToken token)
    {
        return (await division.Teams.SelectAsync(team => RunTeamCheck(division, team, context, token)).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    private async Task<HealthCheckResultDto> RunTeamCheck(DivisionHealthDto division, DivisionTeamDto team, HealthCheckContext context, CancellationToken token)
    {
        var result = new HealthCheckResultDto
        {
            Success = true,
        };

        var contiguousEvents = new List<string>();
        var lastDate = DateTime.MinValue;
        foreach (var date in division.Dates)
        {
            var fixtures = date.Fixtures.Where(f => f.HomeTeamId == team.Id || f.AwayTeamId == team.Id).ToArray();
            var homeEvent = fixtures.Any(f => f.HomeTeamId == team.Id);
            var awayEvent = fixtures.Any(f => f.AwayTeamId == team.Id);
            var hasIntervalPassed = date.Date == lastDate.AddDays(_intervalDays) || lastDate == DateTime.MinValue;

            if (hasIntervalPassed)
            {
                // TODO: Ensure the first event of the season (e.g. AGM) doesn't affect the continuance
                lastDate = date.Date;
            }

            if (!homeEvent && !awayEvent)
            {
                continue;
            }

            if (homeEvent && awayEvent)
            {
                result.Success = false;
                result.Errors.Add($"Found {team.Name} playing against themselves on {date.Date:d MMM yyyy}");
                continue;
            }

            var location = homeEvent ? "home" : "away";
            if (contiguousEvents.Any(e => e != location))
            {
                if (contiguousEvents.Count > _maxContiguousEvents)
                {
                    result.Success = false;
                    result.Warnings.Add($"{team.Name} is playing {contiguousEvents[0]} too many times ({contiguousEvents.Count}) in a row, ending on {date.Date:d MMM yyyy}");
                }

                contiguousEvents.Clear();
            }
            contiguousEvents.Add(location);
        }

        if (contiguousEvents.Count > _maxContiguousEvents)
        {
            result.Success = false;
            result.Warnings.Add($"{team.Name} is playing {contiguousEvents[0]} too many times ({contiguousEvents.Count}) in a row, ending on {lastDate.Date:d MMM yyyy}");
        }

        return result;
    }
}
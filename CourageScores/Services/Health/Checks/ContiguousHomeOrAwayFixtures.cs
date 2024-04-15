using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class ContiguousHomeOrAwayFixtures : ISeasonHealthCheck
{
    private readonly int _intervalDays;
    private readonly int _maxContiguousEvents;

    public ContiguousHomeOrAwayFixtures(int maxContiguousEvents = 2, int intervalDays = 7)
    {
        _maxContiguousEvents = maxContiguousEvents;
        _intervalDays = intervalDays;
    }

    [ExcludeFromCodeCoverage]
    public string Name => $"No more than {_maxContiguousEvents} consecutive home or away fixtures";

    public async Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        return (await divisions.SelectAsync(division => RunDivisionCheck(division, token)).ToList())
            .Aggregate(
                new HealthCheckResultDto
                {
                    Success = true,
                },
                (prev, current) => prev.MergeWith(current));
    }

    private async Task<HealthCheckResultDto> RunDivisionCheck(DivisionHealthDto division, CancellationToken token)
    {
        return (await division.Teams.SelectAsync(team => RunTeamCheck(division, team, token)).ToList())
            .Aggregate(
                new HealthCheckResultDto
                {
                    Success = true,
                },
                (prev, current) => prev.MergeWith(current));
    }

    // ReSharper disable once UnusedParameter.Local
    private Task<HealthCheckResultDto> RunTeamCheck(DivisionHealthDto division, DivisionTeamDto team, CancellationToken token)
    {
        var result = new HealthCheckResultDto
        {
            Success = true,
        };

        var contiguousEvents = new List<EventDetail>();
        foreach (var date in division.Dates)
        {
            var fixtures = date.Fixtures
                .Where(f => f.AwayTeamId != null) // exclude byes
                .Where(f => f.HomeTeamId == team.Id || f.AwayTeamId == team.Id)
                .ToArray();

            if (!fixtures.Any())
            {
                if (date.Date >= contiguousEvents.LastOrDefault()?.Date.AddDays(_intervalDays))
                {
                    if (contiguousEvents.Count > _maxContiguousEvents)
                    {
                        result.Success = false;
                        result.Warnings.Add(GetWarningMessage(division, team, contiguousEvents));
                    }

                    // if there has been over 1 week between fixtures then clear the record of back-to-back games
                    contiguousEvents.Clear();
                }

                continue;
            }

            var location = fixtures.Any(f => f.HomeTeamId == team.Id) ? "home" : "away";
            if (contiguousEvents.Any(e => e.Location != location))
            {
                if (contiguousEvents.Count > _maxContiguousEvents)
                {
                    result.Success = false;
                    result.Warnings.Add(GetWarningMessage(division, team, contiguousEvents));
                }

                contiguousEvents.Clear();
            }

            contiguousEvents.Add(new EventDetail(location, date.Date, fixtures));
        }

        if (contiguousEvents.Count > _maxContiguousEvents)
        {
            result.Success = false;
            result.Warnings.Add(GetWarningMessage(division, team, contiguousEvents));
        }

        return Task.FromResult(result);
    }

    private string GetWarningMessage(DivisionHealthDto division, DivisionTeamDto team, IReadOnlyCollection<EventDetail> contiguousEvents)
    {
        var firstEvent = contiguousEvents.First();
        var lastEvent = contiguousEvents.Last();

        return $"{division.Name}: {team.Name} is playing {contiguousEvents.Count} fixtures in a row at {firstEvent.Location} weeks {GetWeekNumber(firstEvent.Date, division)} - {GetWeekNumber(lastEvent.Date, division)}";
    }

    private int GetWeekNumber(DateTime date, DivisionHealthDto division)
    {
        var sinceStartOfSeason = date.Date.Subtract(division.Dates.Select(d => d.Date).Min());
        return (sinceStartOfSeason.Days / _intervalDays) + 1;
    }

    [ExcludeFromCodeCoverage]
    private class EventDetail
    {
        public EventDetail(string location, DateTime date, IReadOnlyCollection<LeagueFixtureHealthDto> fixtures)
        {
            Location = location;
            Date = date;
            Fixtures = fixtures;
        }

        public string Location { get; }
        public DateTime Date { get; }

        // ReSharper disable once UnusedAutoPropertyAccessor.Local
        public IReadOnlyCollection<LeagueFixtureHealthDto> Fixtures { get; }
    }
}
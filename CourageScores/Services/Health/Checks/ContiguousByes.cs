using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class ContiguousByes : ISeasonHealthCheck
{
    private readonly int _maxContiguousByes;

    public ContiguousByes(int maxContiguousByes = 1)
    {
        _maxContiguousByes = maxContiguousByes;
    }

    [ExcludeFromCodeCoverage]
    public string Name => $"No more than {_maxContiguousByes} consecutive byes";

    public async Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context, CancellationToken token)
    {
        return (await divisions.SelectAsync(division => RunDivisionCheck(division, token)).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    private async Task<HealthCheckResultDto> RunDivisionCheck(DivisionHealthDto division, CancellationToken token)
    {
        return (await division.Teams.SelectAsync(team => RunTeamCheck(division, team, token)).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    // ReSharper disable once UnusedParameter.Local
    private Task<HealthCheckResultDto> RunTeamCheck(DivisionHealthDto division, DivisionTeamDto team, CancellationToken token)
    {
        var result = new HealthCheckResultDto
        {
            Success = true,
        };

        var contiguousByes = new List<DateTime>();
        foreach (var date in division.Dates)
        {
            var fixture = date.Fixtures.SingleOrDefault(f => f.HomeTeamId == team.Id || f.AwayTeamId == team.Id);

            if (fixture?.AwayTeamId != null)
            {
                if (contiguousByes.Count > _maxContiguousByes)
                {
                    result.Success = false;
                    result.Warnings.Add(GetWarningMessage(division, team, contiguousByes));
                }

                contiguousByes.Clear();
            }

            if (fixture != null && fixture.AwayTeamId == null)
            {
                contiguousByes.Add(date.Date);
            }
        }

        if (contiguousByes.Count > _maxContiguousByes)
        {
            result.Success = false;
            result.Warnings.Add(GetWarningMessage(division, team, contiguousByes));
        }

        return Task.FromResult(result);
    }

    private static string GetWarningMessage(DivisionHealthDto division, DivisionTeamDto team, IReadOnlyCollection<DateTime> contiguousDates)
    {
        var firstEvent = contiguousDates.First();
        var lastEvent = contiguousDates.Last();

        return $"{division.Name}: {team.Name} has {contiguousDates.Count} byes in a row from {firstEvent.Date:d MMM yyyy} - {lastEvent.Date:d MMM yyyy}";
    }
}
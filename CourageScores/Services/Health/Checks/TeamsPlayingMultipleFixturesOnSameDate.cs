using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class TeamsPlayingMultipleFixturesOnSameDate : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "Teams are not playing multiple fixtures on the same date";

    public async Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions,
        HealthCheckContext context, CancellationToken token)
    {
        return (await divisions
                .SelectAsync(CheckDivision).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    private static async Task<HealthCheckResultDto> CheckDivision(DivisionHealthDto division)
    {
        var teamResults = await division.Teams.OrderBy(t => t.Name).SelectAsync(t => CheckTeam(division, t)).ToList();
        return teamResults.Aggregate(
            new HealthCheckResultDto { Success = true },
            (prev, current) => prev.MergeWith(current));
    }

    private static Task<HealthCheckResultDto> CheckTeam(DivisionHealthDto division, DivisionTeamDto team)
    {
        var result = new HealthCheckResultDto { Success = true };

        foreach (var date in division.Dates)
        {
            if (date.Fixtures.Count(f => f.HomeTeamId == team.Id) > 1)
            {
                result.Warnings.Add($"{division.Name}: {team.Name} is playing multiple fixtures on {date.Date:d MMM yyyy}");
                result.Success = false;
            }
        }

        return Task.FromResult(result);
    }
}
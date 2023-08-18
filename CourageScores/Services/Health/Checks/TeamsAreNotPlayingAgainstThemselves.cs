using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class TeamsAreNotPlayingAgainstThemselves : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "Teams aren't configured to play against themselves";

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

    private static async Task<HealthCheckResultDto> RunDivisionCheck(DivisionHealthDto division, CancellationToken token)
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
    private static Task<HealthCheckResultDto> RunTeamCheck(DivisionHealthDto division, DivisionTeamDto team, CancellationToken token)
    {
        var result = new HealthCheckResultDto
        {
            Success = true,
        };

        foreach (var date in division.Dates.Where(d => d.Fixtures.Any(f => f.HomeTeamId == team.Id && f.AwayTeamId == team.Id)))
        {
            result.Success = false;
            result.Errors.Add($"Found {team.Name} playing against themselves on {date.Date:d MMM yyyy}");
        }

        return Task.FromResult(result);
    }
}
using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health.Checks;

public class TeamsHaveBothLegs : ISeasonHealthCheck
{
    [ExcludeFromCodeCoverage]
    public string Name => "Teams have both legs defined";

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

    private static async Task<HealthCheckResultDto> CheckTeam(DivisionHealthDto division, DivisionTeamDto team)
    {
        var allFixtures = division.Dates.SelectMany(fd => fd.Fixtures).OrderBy(f => f.HomeTeam).ThenBy(f => f.AwayTeam).ToList();
        var allOtherTeams = division.Teams.Except(new[] { team }).OrderBy(t => t.Name).ToList();

        return (await allOtherTeams.SelectAsync(otherTeam => CheckLegs(division, allFixtures, team, otherTeam)).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    private static Task<HealthCheckResultDto> CheckLegs(DivisionHealthDto division, IEnumerable<LeagueFixtureHealthDto> allFixtures, DivisionTeamDto team1, DivisionTeamDto team2)
    {
        var homeLegs = allFixtures.Where(f => f.HomeTeamId == team1.Id && f.AwayTeamId == team2.Id).ToList();
        switch (homeLegs.Count)
        {
            case 1:
                return Task.FromResult(new HealthCheckResultDto
                {
                    Success = true
                });
            case 0:
                return Task.FromResult(new HealthCheckResultDto
                {
                    Success = false,
                    Warnings =
                    {
                        $"{division.Name}: Missing fixture for {team1.Name} vs {team2.Name}",
                    }
                });
            default:
                return Task.FromResult(new HealthCheckResultDto
                {
                    Success = false,
                    Warnings =
                    {
                        $"{division.Name}: Multiple fixtures for {team1.Name} vs {team2.Name} ({string.Join(", ", homeLegs.Select(l => l.Date.ToString("d MMM yyyy")))})",
                    }
                });
        }
    }
}
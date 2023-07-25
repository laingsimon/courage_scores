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

    private async Task<HealthCheckResultDto> CheckDivision(DivisionHealthDto division)
    {
        var teamResults = await division.Teams.OrderBy(t => t.Name).SelectAsync(t => CheckTeam(division, t)).ToList();
        return teamResults.Aggregate(
            new HealthCheckResultDto { Success = true },
            (prev, current) => prev.MergeWith(current));
    }

    private async Task<HealthCheckResultDto> CheckTeam(DivisionHealthDto division, DivisionTeamDto team)
    {
        var allFixtures = division.Dates.SelectMany(fd => fd.Fixtures).OrderBy(f => f.HomeTeam).ThenBy(f => f.AwayTeam).ToList();
        var allOtherTeams = division.Teams.Except(new[] { team }).OrderBy(t => t.Name).ToList();

        return (await allOtherTeams.SelectAsync(otherTeam => CheckLegs(division, allFixtures, team, otherTeam)).ToList())
            .Aggregate(
                new HealthCheckResultDto { Success = true },
                (prev, current) => prev.MergeWith(current));
    }

    private Task<HealthCheckResultDto> CheckLegs(DivisionHealthDto division, IReadOnlyCollection<LeagueFixtureHealthDto> allFixtures, DivisionTeamDto team1, DivisionTeamDto team2)
    {
        var homeLegs = allFixtures.Where(f => f.HomeTeamId == team1.Id && f.AwayTeamId == team2.Id).ToList();

        var warnings = new List<string>();
        if (homeLegs.Count != 1)
        {
            var dates = homeLegs.Count > 0
                ? $" ({string.Join(", ", homeLegs.Select(l => l.Date.ToString("d MMM yyyy")))})"
                : "";
            warnings.Add($"{division.Name}: Expected 1 leg for {team1.Name} vs {team2.Name}, found {homeLegs.Count}{dates}");
        }

        return Task.FromResult(new HealthCheckResultDto
        {
            Success = warnings.Count == 0,
            Warnings = warnings,
        });
    }
}
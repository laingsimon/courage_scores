using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class TeamsAreNotPlayingAgainstThemselvesTests
{
    private static readonly Guid TeamId = Guid.NewGuid();
    private readonly CancellationToken _token = new();
    private readonly TeamsAreNotPlayingAgainstThemselves _check = new();

    [Test]
    public async Task RunCheck_WithTeamPlayingAgainstSomeoneElse_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams =
            {
                new DivisionTeamDto
                {
                    Id = TeamId,
                    Name = "HOME",
                },
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        new LeagueFixtureHealthDto
                        {
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
                            HomeTeam = "HOME",
                            HomeTeamId = TeamId,
                            AwayTeam = "AWAY",
                            AwayTeamId = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithTeamPlayingAgainstThemselves_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Teams =
            {
                new DivisionTeamDto
                {
                    Id = TeamId,
                    Name = "HOME",
                },
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        new LeagueFixtureHealthDto
                        {
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
                            HomeTeam = "HOME",
                            HomeTeamId = TeamId,
                            AwayTeam = "HOME",
                            AwayTeamId = TeamId,
                        },
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Found HOME playing against themselves on 3 Feb 2001",
        }));
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.False);
    }
}
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class ContiguousByesTests
{
    private static readonly Guid TeamId = Guid.NewGuid();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly ContiguousByes _check = new ContiguousByes();

    [Test]
    public async Task RunCheck_WithNoDates_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithByesInARow_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, ByeFixture()), // 3-Feb 2001
                FixtureDate(1, ByeFixture()), // 10-Feb 2001
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "DIVISION: HOME has 2 byes in a row from 3 Feb 2001 - 10 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_With2ByesInARowThenAFixture_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, ByeFixture()), // 3-Feb 2001
                FixtureDate(1, ByeFixture()), // 10-Feb 2001
                FixtureDate(2, HomeFixture()) // 17-Feb 2001
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "DIVISION: HOME has 2 byes in a row from 3 Feb 2001 - 10 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithByesSplitByAHomeGame_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, ByeFixture()), // 3-Feb 2001
                FixtureDate(1, HomeFixture()), // 10-Feb 2001
                FixtureDate(2, ByeFixture()), // 17-Feb 2001
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithByesSplitByAnAwayGame_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, ByeFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
                FixtureDate(2, ByeFixture()), // 17-Feb 2001
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithFourByesInARow_ReturnsFailureOnce()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, ByeFixture()), // 3-Feb 2001
                FixtureDate(1, ByeFixture()), // 10-Feb 2001
                FixtureDate(2, ByeFixture()), // 17-Feb 2001
                FixtureDate(3, ByeFixture()), // 24-Feb 2001
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "DIVISION: HOME has 4 byes in a row from 3 Feb 2001 - 24 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithMultipleFixturesForTeamOnSameDate_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture(), AwayFixture()), // 3-Feb 2001
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.EquivalentTo(new[] { "DIVISION: Found multiple fixtures on 03 Feb 2001 for HOME" }));
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.False);
    }

    private static DivisionDateHealthDto FixtureDate(int offsetWeeks, params Func<DateTime, LeagueFixtureHealthDto>[] fixtures)
    {
        var date = new DateTime(2001, 02, 03).AddDays(offsetWeeks * 7);

        return new DivisionDateHealthDto
        {
            Date = date,
            Fixtures = fixtures.Select(f => f(date)).ToList(),
        };
    }

    private static Func<DateTime, LeagueFixtureHealthDto> ByeFixture()
    {
        return date => new LeagueFixtureHealthDto
        {
            Date = date,
            Id = Guid.NewGuid(),
            HomeTeam = "HOME",
            HomeTeamId = TeamId,
            AwayTeam = null,
            AwayTeamId = null,
        };
    }

    private static Func<DateTime, LeagueFixtureHealthDto> HomeFixture()
    {
        return date => new LeagueFixtureHealthDto
        {
            Date = date,
            Id = Guid.NewGuid(),
            HomeTeam = "HOME",
            HomeTeamId = TeamId,
            AwayTeam = "OTHER TEAM",
            AwayTeamId = Guid.NewGuid(),
        };
    }

    private static Func<DateTime, LeagueFixtureHealthDto> AwayFixture()
    {
        return date => new LeagueFixtureHealthDto
        {
            Date = date,
            Id = Guid.NewGuid(),
            HomeTeam = "OTHER TEAM",
            HomeTeamId = Guid.NewGuid(),
            AwayTeam = "HOME",
            AwayTeamId = TeamId,
        };
    }
}
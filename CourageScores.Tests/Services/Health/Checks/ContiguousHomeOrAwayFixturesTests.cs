using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class ContiguousHomeOrAwayFixturesTests
{
    private static readonly Guid TeamId = Guid.NewGuid();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly ContiguousHomeOrAwayFixtures _check = new ContiguousHomeOrAwayFixtures();

    [Test]
    public async Task RunCheck_WithNoDates_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithAlternatingHomeAndAwayFixtures_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture()),
                FixtureDate(1, AwayFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithInterspersedNonFixtureDateAndTooManyHomeFixtures_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture()),
                new DivisionDateHealthDto
                {
                    /* e.g. AGM or mid-season meeting */
                    Date = new DateTime(2001, 02, 05),
                },
                FixtureDate(1, HomeFixture()),
                FixtureDate(2, HomeFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "HOME is playing home too many times (3) in a row, ending on 17 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithInterspersedNonFixtureDateAndAcceptableNumberOfHomeFixtures_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture()),
                new DivisionDateHealthDto
                {
                    /* e.g. AGM or mid-season meeting */
                    Date = new DateTime(2001, 02, 05),
                },
                FixtureDate(1, HomeFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithHomeThenAwayFixturesSplitByAWeek_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture()),
                FixtureDate(1),
                FixtureDate(2, AwayFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithTwoHomeFixturesInARow_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture()),
                FixtureDate(1, HomeFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithTwoAwayFixturesInARow_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, AwayFixture()),
                FixtureDate(1, AwayFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithThreeHomeFixturesInARow_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, HomeFixture()),
                FixtureDate(1, HomeFixture()),
                FixtureDate(2, HomeFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "HOME is playing home too many times (3) in a row, ending on 17 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithThreeAwayFixturesInARow_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, AwayFixture()),
                FixtureDate(1, AwayFixture()),
                FixtureDate(2, AwayFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "HOME is playing away too many times (3) in a row, ending on 17 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithFourAwayFixturesInARow_ReturnsFailureOnce()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, AwayFixture()),
                FixtureDate(1, AwayFixture()),
                FixtureDate(2, AwayFixture()),
                FixtureDate(3, AwayFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "HOME is playing away too many times (4) in a row, ending on 24 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithThreeAwayFixturesInARowThenHomeOnce_ReturnsFailureOnce()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, AwayFixture()),
                FixtureDate(1, AwayFixture()),
                FixtureDate(2, AwayFixture()),
                FixtureDate(3, HomeFixture()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "HOME is playing away too many times (3) in a row, ending on 24 Feb 2001" }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithTeamPlayingAgainstThemselves_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Teams = { new DivisionTeamDto { Id = TeamId, Name = "HOME" } },
            Dates =
            {
                FixtureDate(0, PlayingSelf()),
            }
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Found HOME playing against themselves on 3 Feb 2001" }));
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

    private static Func<DateTime, LeagueFixtureHealthDto> PlayingSelf()
    {
        return date => new LeagueFixtureHealthDto
        {
            Date = date,
            Id = Guid.NewGuid(),
            HomeTeam = "HOME",
            HomeTeamId = TeamId,
            AwayTeam = "HOME",
            AwayTeamId = TeamId,
        };
    }
}
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
    private readonly CancellationToken _token = new();
    private readonly ContiguousHomeOrAwayFixtures _check = new();

    [Test]
    public async Task RunCheck_WithNoDates_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                new DivisionTeamDto
                {
                    Id = TeamId,
                    Name = "HOME",
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
    public async Task RunCheck_WithAlternatingHomeAndAwayFixtures_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
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
    public async Task RunCheck_WithInterspersedNonFixtureDateAndTooManyHomeFixtures_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                new DivisionDateHealthDto
                {
                    /* e.g. AGM or mid-season meeting */
                    Date = new DateTime(2001, 02, 05), // 5-Feb 2001
                },
                FixtureDate(1, HomeFixture()), // 10-Feb 2001
                FixtureDate(2, HomeFixture()), // 17-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: HOME is playing 3 fixtures in a row at home from 3 Feb - 17 Feb",
        }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithInterspersedNonFixtureDateAndAcceptableNumberOfHomeFixtures_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                new DivisionDateHealthDto
                {
                    /* e.g. AGM or mid-season meeting */
                    Date = new DateTime(2001, 02, 05), // 5-Feb 2001
                },
                FixtureDate(1, HomeFixture()), // 10-Feb 2001
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
    public async Task RunCheck_WithHomeThenAwayFixturesSplitByAWeek_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                FixtureDate(1), // 10-Feb 2001
                FixtureDate(2, AwayFixture()), // 17-Feb 2001
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
    public async Task RunCheck_WithTwoHomeFixturesInARow_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                FixtureDate(1, HomeFixture()), // 10-Feb 2001
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
    public async Task RunCheck_WithTwoAwayFixturesInARow_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, AwayFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
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
    public async Task RunCheck_WithTwoHomeFixturesInARowThenABye_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                FixtureDate(1, HomeFixture()), // 10-Feb 2001
                FixtureDate(2, ByeFixture()), // 17-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_WithThreeHomeFixturesInARow_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, HomeFixture()), // 3-Feb 2001
                FixtureDate(1, HomeFixture()), // 10-Feb 2001
                FixtureDate(2, HomeFixture()), // 17-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: HOME is playing 3 fixtures in a row at home from 3 Feb - 17 Feb",
        }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithThreeAwayFixturesInARow_ReturnsFailure()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, AwayFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
                FixtureDate(2, AwayFixture()), // 17-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: HOME is playing 3 fixtures in a row at away from 3 Feb - 17 Feb",
        }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithFourAwayFixturesInARow_ReturnsFailureOnce()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, AwayFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
                FixtureDate(2, AwayFixture()), // 17-Feb 2001
                FixtureDate(3, AwayFixture()), // 24-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: HOME is playing 4 fixtures in a row at away from 3 Feb - 24 Feb",
        }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithThreeAwayFixturesInARowThenHomeOnce_ReturnsFailureOnce()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, AwayFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
                FixtureDate(2, AwayFixture()), // 17-Feb 2001
                FixtureDate(3, HomeFixture()), // 24-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: HOME is playing 3 fixtures in a row at away from 3 Feb - 17 Feb",
        }));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RunCheck_WithThreeAwayFixturesInARowThenASpare_ReturnsFailureOnce()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
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
                FixtureDate(0, AwayFixture()), // 3-Feb 2001
                FixtureDate(1, AwayFixture()), // 10-Feb 2001
                FixtureDate(2, AwayFixture()), // 17-Feb 2001
                FixtureDate(3), // 24-Feb 2001
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: HOME is playing 3 fixtures in a row at away from 3 Feb - 17 Feb",
        }));
        Assert.That(result.Success, Is.False);
    }

    private static DivisionDateHealthDto FixtureDate(int offsetWeeks, params Func<DateTime, LeagueFixtureHealthDto>[] fixtures)
    {
        var date = new DateTime(2001, 02, 03).AddDays(offsetWeeks*7);

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
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class TeamsHaveBothLegsTests
{
    private readonly CancellationToken _token = new();
    private readonly TeamsHaveBothLegs _check = new();

    [Test]
    public async Task RunCheck_WithNoLegsForTeam_ReturnsFail()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                new DivisionTeamDto
                {
                    Id = Guid.NewGuid(),
                    Name = "HOME",
                },
                new DivisionTeamDto
                {
                    Id = Guid.NewGuid(),
                    Name = "AWAY",
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: Missing fixture for HOME vs AWAY", "DIVISION: Missing fixture for AWAY vs HOME",
        }));
    }

    [Test]
    public async Task RunCheck_WithOnlyHomeLegForTeam_ReturnsFail()
    {
        var home = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME",
        };
        var away = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY",
        };
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                home,
                away,
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
                            HomeTeam = home.Name,
                            HomeTeamId = home.Id,
                            AwayTeam = away.Name,
                            AwayTeamId = away.Id,
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
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

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: Missing fixture for AWAY vs HOME",
        }));
    }

    [Test]
    public async Task RunCheck_WithOnlyAwayLegForTeam_ReturnsFail()
    {
        var home = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME",
        };
        var away = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY",
        };
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                home,
                away,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 10),
                    Fixtures =
                    {
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = away.Name,
                            HomeTeamId = away.Id,
                            AwayTeam = home.Name,
                            AwayTeamId = home.Id,
                            Date = new DateTime(2001, 02, 10),
                            Id = Guid.NewGuid(),
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

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: Missing fixture for HOME vs AWAY",
        }));
    }

    [Test]
    public async Task RunCheck_WithBothLegsForTeam_ReturnsSuccess()
    {
        var home = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME",
        };
        var away = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY",
        };
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                home,
                away,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 10),
                    Fixtures =
                    {
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = home.Name,
                            HomeTeamId = home.Id,
                            AwayTeam = away.Name,
                            AwayTeamId = away.Id,
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
                        },
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = away.Name,
                            HomeTeamId = away.Id,
                            AwayTeam = home.Name,
                            AwayTeamId = home.Id,
                            Date = new DateTime(2001, 02, 10),
                            Id = Guid.NewGuid(),
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

        Assert.That(result.Success, Is.True);
        Assert.That(result.Warnings, Is.Empty);
    }

    [Test]
    public async Task RunCheck_WithMultipleLegsForTeam_ReturnsFail()
    {
        var home = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME",
        };
        var away = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY",
        };
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                home,
                away,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 10),
                    Fixtures =
                    {
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = home.Name,
                            HomeTeamId = home.Id,
                            AwayTeam = away.Name,
                            AwayTeamId = away.Id,
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
                        },
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = away.Name,
                            HomeTeamId = away.Id,
                            AwayTeam = home.Name,
                            AwayTeamId = home.Id,
                            Date = new DateTime(2001, 02, 10),
                            Id = Guid.NewGuid(),
                        },
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = away.Name,
                            HomeTeamId = away.Id,
                            AwayTeam = home.Name,
                            AwayTeamId = home.Id,
                            Date = new DateTime(2001, 02, 17),
                            Id = Guid.NewGuid(),
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

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "DIVISION: Multiple fixtures for AWAY vs HOME (10 Feb, 17 Feb)",
        }));
    }
}
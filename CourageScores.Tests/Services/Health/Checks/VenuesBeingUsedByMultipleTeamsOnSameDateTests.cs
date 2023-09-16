using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class VenuesBeingUsedByMultipleTeamsOnSameDateTests
{
    private readonly CancellationToken _token = new();
    private readonly VenuesBeingUsedByMultipleTeamsOnSameDate _check = new();
    private readonly DivisionTeamDto _teamA = new()
    {
        Id = Guid.NewGuid(),
        Name = "A",
        Address = "ADDRESS",
    };
    private readonly DivisionTeamDto _teamB = new()
    {
        Id = Guid.NewGuid(),
        Name = "B",
        Address = "ADDRESS",
    };
    private readonly DivisionTeamDto _anotherTeam = new()
    {
        Id = Guid.NewGuid(),
        Name = "AWAY",
        Address = "Another address",
    };

    [Test]
    public async Task RunCheck_GivenNoDates_ReturnsSuccess()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _teamB,
                _anotherTeam,
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenDateWithSingleFixture_ReturnsSuccess()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamA, _anotherTeam),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenTeamWithNoAddress_ReturnsSuccess()
    {
        var teamANoAddress = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
        };
        var anotherTeamNoAddress = new DivisionTeamDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY",
        };
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), teamANoAddress, anotherTeamNoAddress),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenDateWithAllFixturesAtDifferentVenues_ReturnsSuccess()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamA, _anotherTeam),
                    },
                },
            },
        };
        var division2 = new DivisionHealthDto
        {
            Name = "DIVISION 2",
            Teams =
            {
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _anotherTeam, _teamB),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1, division2,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenDateWithTwoFixturesUsingSameVenuesAndOneIsABye_ReturnsSuccess()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamA, _anotherTeam),
                        Fixture(new DateTime(2001, 02, 03), _teamB, null),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenDateWithTwoFixturesUsingSameVenues_ReturnsFailure()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamA, _anotherTeam),
                        Fixture(new DateTime(2001, 02, 03), _teamB, _anotherTeam),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1,
        }, context, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "ADDRESS is being used for 2 fixtures on 3 Feb",
        }));
    }

    [Test]
    public async Task RunCheck_GivenDateWithTwoFixturesUsingSameVenuesFromDifferentDivisions_ReturnsFailure()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamA, _anotherTeam),
                    },
                },
            },
        };
        var division2 = new DivisionHealthDto
        {
            Name = "DIVISION 2",
            Teams =
            {
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamB, _anotherTeam),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1, division2,
        }, context, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "ADDRESS is being used for 2 fixtures on 3 Feb",
        }));
    }

    [Test]
    public async Task RunCheck_GivenSameVenueUsedOnDifferentDates_ReturnsSuccess()
    {
        var division1 = new DivisionHealthDto
        {
            Name = "DIVISION 1",
            Teams =
            {
                _teamA,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 03), _teamA, _anotherTeam),
                    },
                },
            },
        };
        var division2 = new DivisionHealthDto
        {
            Name = "DIVISION 2",
            Teams =
            {
                _teamB,
                _anotherTeam,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 10),
                    Fixtures =
                    {
                        Fixture(new DateTime(2001, 02, 10), _teamB, _anotherTeam),
                    },
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division1, division2,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    private static LeagueFixtureHealthDto Fixture(DateTime date, DivisionTeamDto home, DivisionTeamDto? away)
    {
        return new LeagueFixtureHealthDto
        {
            HomeTeam = home.Name,
            HomeTeamAddress = home.Address,
            HomeTeamId = home.Id,
            AwayTeam = away?.Name,
            AwayTeamAddress = away?.Address,
            AwayTeamId = away?.Id,
            Date = date,
            Id = Guid.NewGuid(),
        };
    }
}
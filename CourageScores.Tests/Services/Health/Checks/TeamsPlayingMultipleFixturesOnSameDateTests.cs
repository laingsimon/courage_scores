using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class TeamsPlayingMultipleFixturesOnSameDateTests
{
    private readonly CancellationToken _token = new();
    private readonly TeamsPlayingMultipleFixturesOnSameDate _check = new();
    private readonly DivisionTeamDto _home = new()
    {
        Id = Guid.NewGuid(),
        Name = "HOME",
    };
    private readonly DivisionTeamDto _away = new()
    {
        Id = Guid.NewGuid(),
        Name = "AWAY",
    };

    [Test]
    public async Task Check_WhenNoDates_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                _home,
                _away,
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_WhenNoFixtures_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                _home,
                _away,
            },
            Dates =
            {
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 03),
                },
            },
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_WhenNoTeams_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
        };
        var context = new HealthCheckContext(new SeasonHealthDto());

        var result = await _check.RunCheck(new[]
        {
            division,
        }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_WhenTeamPlayingSingleFixtureOnSameDate_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                _home,
                _away,
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
                            HomeTeam = _home.Name,
                            HomeTeamId = _home.Id,
                            AwayTeam = _away.Name,
                            AwayTeamId = _away.Id,
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

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_WhenTeamPlayingMultipleFixturesOnSameDate_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                _home,
                _away,
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
                            HomeTeam = _home.Name,
                            HomeTeamId = _home.Id,
                            AwayTeam = _away.Name,
                            AwayTeamId = _away.Id,
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
                        },
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = _home.Name,
                            HomeTeamId = _home.Id,
                            AwayTeam = "ANOTHER TEAM",
                            AwayTeamId = Guid.NewGuid(),
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
            "DIVISION: HOME is playing multiple fixtures on 3 Feb",
        }));
    }

    [Test]
    public async Task Check_WhenTeamPlayingSingleFixturePerDate_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Name = "DIVISION",
            Teams =
            {
                _home,
                _away,
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
                            HomeTeam = _home.Name,
                            HomeTeamId = _home.Id,
                            AwayTeam = _away.Name,
                            AwayTeamId = _away.Id,
                            Date = new DateTime(2001, 02, 03),
                            Id = Guid.NewGuid(),
                        },
                    },
                },
                new DivisionDateHealthDto
                {
                    Date = new DateTime(2001, 02, 10),
                    Fixtures =
                    {
                        new LeagueFixtureHealthDto
                        {
                            HomeTeam = _away.Name,
                            HomeTeamId = _away.Id,
                            AwayTeam = _home.Name,
                            AwayTeamId = _home.Id,
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
    }
}
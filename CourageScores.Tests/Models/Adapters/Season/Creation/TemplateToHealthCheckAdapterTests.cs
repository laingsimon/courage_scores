using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class TemplateToHealthCheckAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TemplateToHealthCheckAdapter _adapter = new TemplateToHealthCheckAdapter();

    [Test]
    public async Task Adapt_GivenSingleDivision_ShouldReturnCorrectly()
    {
        var template = new Template
        {
            Divisions =
            {
                new DivisionTemplate
                {
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A" },
                    new DivisionTeamDto { Name = "B" },
                    new DivisionTeamDto { Name = "C" },
                    new DivisionTeamDto { Name = "D" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D" }
                        }
                    }
                }
            });
    }

    [Test]
    public async Task Adapt_GivenSeasonSharedAddressesNotInDivision_ShouldNotSetSharedAddress()
    {
        var template = new Template
        {
            SharedAddresses =
            {
                new SharedAddress { Teams = { "E", "F" } },
            },
            Divisions =
            {
                new DivisionTemplate
                {
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A" },
                    new DivisionTeamDto { Name = "B" },
                    new DivisionTeamDto { Name = "C" },
                    new DivisionTeamDto { Name = "D" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D" }
                        }
                    }
                }
            });
    }

    [Test]
    public async Task Adapt_GivenSeasonSharedAddresses_ShouldSetSharedAddress()
    {
        var template = new Template
        {
            SharedAddresses =
            {
                new SharedAddress { Teams = { "A", "D" } },
            },
            Divisions =
            {
                new DivisionTemplate
                {
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A", Address = "A & D" },
                    new DivisionTeamDto { Name = "B" },
                    new DivisionTeamDto { Name = "C" },
                    new DivisionTeamDto { Name = "D", Address = "A & D" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B", HomeTeamAddress = "A & D" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D", AwayTeamAddress = "A & D" }
                        }
                    }
                }
            });
    }

    [Test]
    public async Task Adapt_GivenDivisionSharedAddressesNotInDivision_ShouldNotSetSharedAddress()
    {
        var template = new Template
        {
            Divisions =
            {
                new DivisionTemplate
                {
                    SharedAddresses =
                    {
                        new SharedAddress { Teams = { "E", "F" } },
                    },
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A" },
                    new DivisionTeamDto { Name = "B" },
                    new DivisionTeamDto { Name = "C" },
                    new DivisionTeamDto { Name = "D" },
                    new DivisionTeamDto { Name = "E", Address = "E & F" },
                    new DivisionTeamDto { Name = "F", Address = "E & F" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D" }
                        }
                    }
                }
            });
    }

    [Test]
    public async Task Adapt_GivenDivisionSharedAddresses_ShouldSetSharedAddress()
    {
        var template = new Template
        {
            Divisions =
            {
                new DivisionTemplate
                {
                    SharedAddresses =
                    {
                        new SharedAddress { Teams = { "A", "D" } },
                    },
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A", Address = "A & D" },
                    new DivisionTeamDto { Name = "B" },
                    new DivisionTeamDto { Name = "C" },
                    new DivisionTeamDto { Name = "D", Address = "A & D" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B", HomeTeamAddress = "A & D" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D", AwayTeamAddress = "A & D" }
                        }
                    }
                }
            });
    }

    [Test]
    public async Task Adapt_GivenSeasonAndDivisionSharedAddresses_ShouldSetSharedAddress()
    {
        var template = new Template
        {
            SharedAddresses =
            {
                new SharedAddress { Teams = { "A", "D" } },
            },
            Divisions =
            {
                new DivisionTemplate
                {
                    SharedAddresses =
                    {
                        new SharedAddress { Teams = { "A", "B" } },
                    },
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A", Address = "A & D" },
                    new DivisionTeamDto { Name = "B", Address = "A & D" },
                    new DivisionTeamDto { Name = "C" },
                    new DivisionTeamDto { Name = "D", Address = "A & D" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B", HomeTeamAddress = "A & D", AwayTeamAddress = "A & D" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D", AwayTeamAddress = "A & D" }
                        }
                    }
                }
            });
    }

    [Test]
    public async Task Adapt_GivenMultipleDates_ShouldSetDateCorrectly()
    {
        var template = new Template
        {
            Divisions =
            {
                new DivisionTemplate
                {
                    Dates =
                    {
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "A", Away = "B" },
                                new FixtureTemplate { Home = "C", Away = "D" },
                            }
                        },
                        new DateTemplate
                        {
                            Fixtures =
                            {
                                new FixtureTemplate { Home = "B", Away = "C" },
                                new FixtureTemplate { Home = "A", Away = "D" },
                            }
                        },
                    },
                },
            },
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    new DivisionTeamDto { Name = "A" }, new DivisionTeamDto { Name = "B" },
                    new DivisionTeamDto { Name = "C" }, new DivisionTeamDto { Name = "D" },
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "B" },
                            new LeagueFixtureHealthDto { HomeTeam = "C", AwayTeam = "D" }
                        }
                    },
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 08),
                        Fixtures =
                        {
                            new LeagueFixtureHealthDto { HomeTeam = "B", AwayTeam = "C" },
                            new LeagueFixtureHealthDto { HomeTeam = "A", AwayTeam = "D" }
                        }
                    }
                }
            });
    }

    private static void AssertDivision(
        DivisionHealthDto division,
        DivisionHealthDto expected)
    {
        Assert.That(division.Name, Is.EqualTo(expected.Name));
        Assert.That(division.Teams.Select(t => t.Name), Is.EquivalentTo(expected.Teams.Select(t => t.Name)));
        Assert.That(division.Teams.Select(t => t.Address), Is.EquivalentTo(expected.Teams.Select(t => t.Address)));

        Assert.That(division.Dates.Count, Is.EqualTo(expected.Dates.Count));

        for (var index = 0; index < expected.Dates.Count; index++)
        {
            var expectedDate = expected.Dates[index];
            var actualDate = division.Dates[index];

            AssertFixtureDate(actualDate, expectedDate);
        }
    }

    private static void AssertFixtureDate(DivisionDateHealthDto date, DivisionDateHealthDto expected)
    {
        Assert.That(date.Fixtures.Count, Is.EqualTo(expected.Fixtures.Count));
        Assert.That(date.Date, Is.EqualTo(expected.Date));

        for (var index = 0; index < expected.Fixtures.Count; index++)
        {
            var expectedFixture = expected.Fixtures[index];
            var actualFixture = date.Fixtures[index];

            AssertFixture(actualFixture, expectedFixture);
        }
    }

    private static void AssertFixture(LeagueFixtureHealthDto actual, LeagueFixtureHealthDto expected)
    {
        Assert.That(actual.HomeTeam, Is.EqualTo(expected.HomeTeam));
        Assert.That(actual.HomeTeamAddress, Is.EqualTo(expected.HomeTeamAddress));
        Assert.That(actual.AwayTeam, Is.EqualTo(expected.AwayTeam));
        Assert.That(actual.AwayTeamAddress, Is.EqualTo(expected.AwayTeamAddress));
    }
}
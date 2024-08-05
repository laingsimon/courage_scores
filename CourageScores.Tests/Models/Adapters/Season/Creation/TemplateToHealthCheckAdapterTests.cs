using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class TemplateToHealthCheckAdapterTests
{
    private static readonly DivisionTeamDto TeamA = DivisionTeamDto("A");
    private static readonly DivisionTeamDto TeamB = DivisionTeamDto("B");
    private static readonly DivisionTeamDto TeamC = DivisionTeamDto("C");
    private static readonly DivisionTeamDto TeamD = DivisionTeamDto("D");
    // ReSharper disable once InconsistentNaming
    private static readonly DivisionTemplate DivisionTemplateABCD = new DivisionTemplate
    {
        Dates =
        {
            DateTemplate("A vs B", "C vs D"),
        },
    };

    private readonly CancellationToken _token = new();
    private readonly TemplateToHealthCheckAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenNoDivisions_ShouldReturnCorrectly()
    {
        var template = new Template
        {
            Name = "NAME",
        };

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(0));
        Assert.That(result.Name, Is.EqualTo("NAME"));
    }

    [Test]
    public async Task Adapt_GivenSingleDivision_ShouldReturnCorrectly()
    {
        var template = Template(DivisionTemplateABCD);

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
                    TeamA, TeamB, TeamC, TeamD,
                },
                Dates =
                {
                    DivisionDateHealthDto("A vs B", "C vs D"),
                },
            });
    }

    [Test]
    public async Task Adapt_GivenByeFixture_ShouldReturnCorrectly()
    {
        var template = Template("A");

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
                    TeamA,
                },
                Dates =
                {
                    DivisionDateHealthDto("A"),
                },
            });
    }

    [Test]
    public async Task Adapt_GivenSeasonSharedAddressesNotInDivision_ShouldNotSetSharedAddress()
    {
        var template = Template(
            SharedAddresses("E", "F"),
            DivisionTemplateABCD);

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
                    TeamA, TeamB, TeamC, TeamD,
                },
                Dates =
                {
                    DivisionDateHealthDto("A vs B", "C vs D"),
                },
            });
    }

    [Test]
    public async Task Adapt_GivenSeasonSharedAddresses_ShouldSetSharedAddress()
    {
        var template = Template(
            SharedAddresses("A", "D"),
            DivisionTemplateABCD);

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
                    DivisionTeamDto("A", address: "A & D"),
                    TeamB,
                    TeamC,
                    DivisionTeamDto("D", address: "A & D"),
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            FixtureHealthDto("A vs B", homeTeamAddress: "A & D"),
                            FixtureHealthDto("C vs D", awayTeamAddress: "A & D"),
                        },
                    },
                },
            });
    }

    [Test]
    public async Task Adapt_GivenDivisionSharedAddressesNotInDivision_ShouldNotSetSharedAddress()
    {
        var template = Template(DivisionTemplate(
            SharedAddresses("E", "F"),
            DateTemplate("A vs B", "C vs D")));

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
                    TeamA, TeamB, TeamC, TeamD,
                    DivisionTeamDto("E", address: "E & F"),
                    DivisionTeamDto("F", address: "E & F"),
                },
                Dates =
                {
                    DivisionDateHealthDto("A vs B", "C vs D"),
                },
            });
    }

    [Test]
    public async Task Adapt_GivenDivisionSharedAddresses_ShouldSetSharedAddress()
    {
        var template = Template(
            DivisionTemplate(
                SharedAddresses("A", "D"),
                DateTemplate("A vs B", "C vs D")));

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
                    DivisionTeamDto("A", address: "A & D"),
                    TeamB,
                    TeamC,
                    DivisionTeamDto("D", address: "A & D"),
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            FixtureHealthDto("A vs B", homeTeamAddress: "A & D"),
                            FixtureHealthDto("C vs D", awayTeamAddress: "A & D"),
                        },
                    },
                },
            });
    }

    [Test]
    public async Task Adapt_GivenSeasonAndDivisionSharedAddresses_ShouldSetSharedAddress()
    {
        var template = Template(
            SharedAddresses("A", "D"),
            DivisionTemplate(
                SharedAddresses("A", "B"),
                DateTemplate("A vs B", "C vs D")));

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
                    DivisionTeamDto("A", address: "A & B & D"),
                    DivisionTeamDto("B", address: "A & B & D"),
                    TeamC,
                    DivisionTeamDto("D", address: "A & B & D"),
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            FixtureHealthDto("A vs B", homeTeamAddress: "A & B & D", awayTeamAddress: "A & B & D"),
                            FixtureHealthDto("C vs D", awayTeamAddress: "A & B & D"),
                        },
                    },
                },
            });
    }

    [Test]
    public async Task Adapt_GivenTeamWithMultipleDivisionSharedAddresses_ShouldSetSharedAddress()
    {
        var template = new Template
        {
            SharedAddresses =
            {
                SharedAddresses("A", "D"),
            },
            Divisions =
            {
                new DivisionTemplate
                {
                    SharedAddresses =
                    {
                        SharedAddresses("A", "D"),
                        SharedAddresses("A", "C"), // something different to A & D
                    },
                    Dates =
                    {
                        DateTemplate("A vs B", "C vs D"),
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
                    DivisionTeamDto("A", address: "A & C & D"),
                    TeamB,
                    DivisionTeamDto("C", address: "A & C & D"),
                    DivisionTeamDto("D", address: "A & C & D"),
                },
                Dates =
                {
                    new DivisionDateHealthDto
                    {
                        Date = new DateTime(2023, 01, 01),
                        Fixtures =
                        {
                            FixtureHealthDto("A vs B", homeTeamAddress: "A & C & D"),
                            FixtureHealthDto("C vs D", homeTeamAddress: "A & C & D", awayTeamAddress: "A & C & D"),
                        },
                    },
                },
            });
    }

    [Test]
    public async Task Adapt_GivenMultipleDates_ShouldSetDateCorrectly()
    {
        var template = Template(
            DivisionTemplate(
                new List<string>(),
                DateTemplate("A vs B", "C vs D"),
                DateTemplate("B vs C", "A vs D")));

        var result = await _adapter.Adapt(template, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Divisions.Count, Is.EqualTo(1));
        Assert.That(result.StartDate, Is.EqualTo(new DateTime(2023, 01, 01)));
        Assert.That(result.EndDate, Is.EqualTo(new DateTime(2023, 01, 08)));
        AssertDivision(
            result.Divisions[0],
            new DivisionHealthDto
            {
                Name = "Division 1",
                Teams =
                {
                    TeamA, TeamB, TeamC, TeamD,
                },
                Dates =
                {
                    DivisionDateHealthDto("A vs B", "C vs D"),
                    DivisionDateHealthDto(new DateTime(2023, 01, 08), "B vs C", "A vs D"),
                },
            });
    }

    private static List<string> SharedAddresses(params string[] addresses)
    {
        return addresses.ToList();
    }

    private static DivisionTeamDto DivisionTeamDto(string name, string? address = null)
    {
        return new DivisionTeamDto
        {
            Name = name,
#pragma warning disable CS8601 // Possible null reference assignment.
            Address = address,
#pragma warning restore CS8601 // Possible null reference assignment.
        };
    }

    private static DivisionTemplate DivisionTemplate(List<string> sharedAddresses, params DateTemplate[] dates)
    {
        return new DivisionTemplate
        {
            SharedAddresses =
            {
                sharedAddresses,
            },
            Dates = dates.ToList(),
        };
    }

    private static Template Template(List<string> sharedAddresses, params DivisionTemplate[] divisions)
    {
        return new Template
        {
            SharedAddresses =
            {
                sharedAddresses,
            },
            Divisions = divisions.ToList(),
        };
    }

    private static Template Template(params DivisionTemplate[] divisions)
    {
        return new Template
        {
            Divisions = divisions.ToList(),
        };
    }

    private static Template Template(params string[] fixturesInFirstDate)
    {
        return new Template
        {
            Divisions =
            {
                new DivisionTemplate
                {
                    Dates =
                    {
                        DateTemplate(fixturesInFirstDate),
                    },
                },
            },
        };
    }

    private static DateTemplate DateTemplate(params string[] fixtures)
    {
        return new DateTemplate
        {
            Fixtures = fixtures.Select(FixtureTemplate).ToList(),
        };
    }

    private static FixtureTemplate FixtureTemplate(string mnemonic)
    {
        var versus = mnemonic.Split("vs").Select(mnemonics => mnemonics.Trim()).ToArray();

        return new FixtureTemplate
        {
            Home = versus[0],
            Away = versus.Length > 1 ? versus[1] : null,
        };
    }

    private static DivisionDateHealthDto DivisionDateHealthDto(params string[] mnemonics)
    {
        return DivisionDateHealthDto(null, mnemonics);
    }

    private static DivisionDateHealthDto DivisionDateHealthDto(DateTime? date = null, params string[] mnemonics)
    {
        return new DivisionDateHealthDto
        {
            Date = date ?? new DateTime(2023, 01, 01),
            Fixtures = mnemonics.Select(mnemonic => FixtureHealthDto(mnemonic)).ToList(),
        };
    }

    private static LeagueFixtureHealthDto FixtureHealthDto(string mnemonic, string? homeTeamAddress = null, string? awayTeamAddress = null)
    {
        var versus = mnemonic.Split("vs").Select(mnemonics => mnemonics.Trim()).ToArray();

        return new LeagueFixtureHealthDto
        {
            HomeTeam = versus[0],
            AwayTeam = versus.Length > 1 ? versus[1] : null,
            HomeTeamAddress = homeTeamAddress,
            AwayTeamAddress = awayTeamAddress,
        };
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
        Assert.That(actual.HomeTeamAddress, Is.EqualTo(expected.HomeTeamAddress), () => $"Home address for {expected.HomeTeam} vs {expected.AwayTeam} is incorrect");
        Assert.That(actual.AwayTeam, Is.EqualTo(expected.AwayTeam));
        Assert.That(actual.AwayTeamAddress, Is.EqualTo(expected.AwayTeamAddress), () => $"Away address for {expected.HomeTeam} vs {expected.AwayTeam} is incorrect");
    }
}
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class AddressAssignmentStrategyTests
{
    private static readonly TeamDto TeamA = new TeamDto
    {
        Name = "A",
        Address = "Venue",
    };
    private static readonly TeamDto TeamB = new TeamDto
    {
        Name = "B",
        Address = "Venue",
    };
    private static readonly TeamDto TeamC = new TeamDto
    {
        Name = "C",
        Address = "Venue",
    };
    private static readonly TeamDto TeamD = new TeamDto
    {
        Id = Guid.NewGuid(),
        Name = "D",
        Address = "Venue 1",
    };
    private static readonly TeamDto TeamE = new TeamDto
    {
        Id = Guid.NewGuid(),
        Name = "E",
        Address = "Venue 2",
    };
    private static readonly DivisionDataDto Division1 = new DivisionDataDto
    {
        Id = Guid.NewGuid(),
        Name = "Division 1",
    };
    private static readonly DivisionDataDto Division2 = new DivisionDataDto
    {
        Id = Guid.NewGuid(),
        Name = "Division 2",
    };
    private static readonly TeamPlaceholderDto TeamPlaceholderA = new TeamPlaceholderDto("A");
    private static readonly TeamPlaceholderDto TeamPlaceholderB = new TeamPlaceholderDto("B");
    private static readonly TeamPlaceholderDto TeamPlaceholderC = new TeamPlaceholderDto("C");
    private static readonly TeamPlaceholderDto TeamPlaceholderD = new TeamPlaceholderDto("D");
    // ReSharper disable once InconsistentNaming
    private static readonly TemplateDto ABBATemplate = new TemplateDto
    {
        Divisions =
        {
            new DivisionTemplateDto
            {
                Dates =
                {
                    new DateTemplateDto
                    {
                        Fixtures =
                        {
                            Versus(TeamPlaceholderA, TeamPlaceholderB),
                        },
                    },
                    new DateTemplateDto
                    {
                        Fixtures =
                        {
                            Versus(TeamPlaceholderB, TeamPlaceholderA),
                        },
                    },
                },
            },
        },
    };
    // ReSharper disable once InconsistentNaming
    private static readonly TemplateDto ABTemplate = new TemplateDto
    {
        Divisions =
        {
            new DivisionTemplateDto
            {
                SharedAddresses =
                {
                    List(TeamPlaceholderA, TeamPlaceholderB),
                },
            },
        },
    };

    private readonly CancellationToken _token = new();
    private readonly AddressAssignmentStrategy _strategy = new();
    private readonly SeasonDto _season = new();

    [Test]
    public async Task AssignAddresses_GivenMoreSeasonSharedAddressesThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDto();
        var context = ProposalContext(
            Array(Division1, Division2),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA)
                },
                {
                    Division2.Id, Array(TeamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Too many teams in the season with addresses shared across the divisions",
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenSameNumberOfSeasonSharedAddressesAsInTemplate_MapsEachSeasonSharedAddressCorrectly()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                List(TeamPlaceholderA, TeamPlaceholderB),
            },
            Divisions =
            {
                Division(FixtureDate("A", "D"), FixtureDate("A")),
                Division(FixtureDate("B", "C"), FixtureDate("C")),
            },
        };
        var context = ProposalContext(
            Array(Division1, Division2),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA)
                },
                {
                    Division2.Id, Array(TeamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            TeamA, TeamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenFewerSeasonSharedAddressesThanInTemplate_MapsEachSeasonSharedAddressCorrectly()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                List(TeamPlaceholderB, TeamPlaceholderA),
                List(TeamPlaceholderD, TeamPlaceholderC),
            },
            Divisions =
            {
                Division(FixtureDate("A", "C"), FixtureDate("A")),
                Division(FixtureDate("B", "D"), FixtureDate("B")),
            },
        };
        var context = ProposalContext(
            Array(Division1, Division2),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA)
                },
                {
                    Division2.Id, Array(TeamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            TeamA, TeamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenSeasonSharedAddressWithMoreTeamsThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                List(TeamPlaceholderA, TeamPlaceholderB),
            },
            Divisions =
            {
                Division(FixtureDate("A", "D"), FixtureDate("A")),
                Division(FixtureDate("D", "B"), FixtureDate("D")),
                Division(FixtureDate("C")),
            },
        };
        var division3 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var context = ProposalContext(
            Array(Division1, Division2, division3),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA)
                },
                {
                    Division2.Id, Array(TeamB)
                },
                {
                    division3.Id, Array(TeamC)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Shared address has more teams than the template supports",
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenMoreDivisionSharedAddressesThanInTemplateDivision_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto(),
            },
        };
        var context = ProposalContext(
            Array(Division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA, TeamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Division 1: Too many teams with addresses shared",
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenSameNumberOfDivisionSharedAddressesAsInTemplateDivision_MapsEachDivisionSharedAddressCorrectly()
    {
        var context = ProposalContext(
            Array(Division1),
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA, TeamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA).Or.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB).Or.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            TeamA, TeamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenFewerDivisionSharedAddressesThanInTemplateDivision_MapsEachDivisionSharedAddressCorrectly()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto
                {
                    SharedAddresses =
                    {
                        List(TeamPlaceholderA, TeamPlaceholderB),
                        List(TeamPlaceholderC, TeamPlaceholderD),
                    },
                },
            },
        };
        var context = ProposalContext(
            Array(Division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA, TeamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA).Or.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB).Or.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            TeamA, TeamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenDivisionSharedAddressWithMoreTeamsThanInTemplate_ReturnsFailure()
    {
        var context = ProposalContext(
            Array(Division1),
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamA, TeamB, TeamC)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Division 1: Shared address has more teams than the template supports",
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenInsufficientNonSharedAddressPlaceholders_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto(),
            },
        };
        var context = ProposalContext(
            Array(Division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamD, TeamE)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Division 1: More teams in division than templates support",
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenNoSharedAddress_MapsEachTeamToARandomPlaceholder()
    {
        var context = ProposalContext(
            Array(Division1),
            ABBATemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamD, TeamE)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamD).Or.EqualTo(TeamE));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamE).Or.EqualTo(TeamD));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            TeamD, TeamE,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenRequestedPlaceholderMappingsToNoExistentTeams_MapsEachTeamToARandomPlaceholder()
    {
        var placeholderMappings = new Dictionary<string, Guid>
        {
            { "A", Guid.NewGuid() },
        };
        var context = ProposalContext(
            Array(Division1),
            ABBATemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamD, TeamE)
                },
            },
            placeholderMappings);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamD).Or.EqualTo(TeamE));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamE).Or.EqualTo(TeamD));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            TeamD, TeamE,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenRequestedPlaceholderMappings_MapsTeamsToGivenPlaceholders()
    {
        var placeholderMappings = new Dictionary<string, Guid>
        {
            { "A", TeamD.Id },
        };
        var context = ProposalContext(
            Array(Division1),
            ABBATemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    Division1.Id, Array(TeamD, TeamE)
                },
            },
            placeholderMappings);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamD));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamE));
    }

    private static FixtureTemplateDto Versus(TeamPlaceholderDto home, TeamPlaceholderDto away)
    {
        return new FixtureTemplateDto
        {
            Home = home,
            Away = away,
        };
    }

    private static T[] Array<T>(params T[] items)
    {
        return items;
    }

    private static List<T> List<T>(params T[] items)
    {
        return items.ToList();
    }

    private ProposalContext ProposalContext(IEnumerable<DivisionDataDto> divisions, TemplateDto template, Dictionary<Guid, TeamDto[]> teams, Dictionary<string, Guid>? placeholderMappings = null)
    {
        return new ProposalContext(
            new TemplateMatchContext(_season, divisions, teams, placeholderMappings ?? new()),
            template,
            new ActionResultDto<ProposalResultDto>
            {
                Result = new ProposalResultDto(),
            });
    }

    private static DateTemplateDto FixtureDate(string home, string? away = null)
    {
        return new DateTemplateDto
        {
            Fixtures =
            {
                new FixtureTemplateDto
                {
                    Home = new TeamPlaceholderDto(home),
                    Away = away != null ? new TeamPlaceholderDto(away) : null,
                },
            }
        };
    }

    private static DivisionTemplateDto Division(params DateTemplateDto[] dates)
    {
        return new DivisionTemplateDto
        {
            Dates = dates.ToList(),
        };
    }
}
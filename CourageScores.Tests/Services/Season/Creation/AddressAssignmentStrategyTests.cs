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
    private readonly CancellationToken _token = new();
    private readonly AddressAssignmentStrategy _strategy = new();
    private readonly SeasonDto _season = new();

    [Test]
    public async Task AssignAddresses_GivenMoreSeasonSharedAddressesThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDto();
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var division2 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var context = ProposalContext(
            Array(division1, division2),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, new[]
                    {
                        new TeamDto
                        {
                            Address = "Venue",
                        },
                    }
                },
                {
                    division2.Id, new[]
                    {
                        new TeamDto
                        {
                            Address = "Venue",
                        },
                    }
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
                new[]
                {
                    new TeamPlaceholderDto("B"), new TeamPlaceholderDto("A"),
                }.ToList(),
            },
            Divisions =
            {
                Division(FixtureDate("A", "D"), FixtureDate("A")),
                Division(FixtureDate("B", "C"), FixtureDate("C")),
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var division2 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var context = ProposalContext(
            Array(division1, division2),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA)
                },
                {
                    division2.Id, Array(teamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            teamA, teamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenFewerSeasonSharedAddressesThanInTemplate_MapsEachSeasonSharedAddressCorrectly()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                new[]
                {
                    new TeamPlaceholderDto("B"), new TeamPlaceholderDto("A"),
                }.ToList(),
                new[]
                {
                    new TeamPlaceholderDto("D"), new TeamPlaceholderDto("C"),
                }.ToList(),
            },
            Divisions =
            {
                Division(FixtureDate("A", "C"), FixtureDate("A")),
                Division(FixtureDate("B", "D"), FixtureDate("B")),
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var division2 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var context = ProposalContext(
            Array(division1, division2),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA)
                },
                {
                    division2.Id, Array(teamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            teamA, teamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenSeasonSharedAddressWithMoreTeamsThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                new[]
                {
                    new TeamPlaceholderDto("A"), new TeamPlaceholderDto("B"),
                }.ToList(),
            },
            Divisions =
            {
                Division(FixtureDate("A", "D"), FixtureDate("A")),
                Division(FixtureDate("D", "B"), FixtureDate("D")),
                Division(FixtureDate("C")),
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var teamC = new TeamDto
        {
            Name = "C",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var division2 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var division3 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var context = ProposalContext(
            Array(division1, division2, division3),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA)
                },
                {
                    division2.Id, Array(teamB)
                },
                {
                    division3.Id, Array(teamC)
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
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
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
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto
                {
                    SharedAddresses =
                    {
                        new[]
                        {
                            new TeamPlaceholderDto("A"), new TeamPlaceholderDto("B"),
                        }.ToList(),
                    },
                },
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };

        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            teamA, teamB,
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
                        new[]
                        {
                            new TeamPlaceholderDto("A"), new TeamPlaceholderDto("B"),
                        }.ToList(),
                        new[]
                        {
                            new TeamPlaceholderDto("C"), new TeamPlaceholderDto("D"),
                        }.ToList(),
                    },
                },
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            teamA, teamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenDivisionSharedAddressWithMoreTeamsThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto
                {
                    SharedAddresses =
                    {
                        new[]
                        {
                            new TeamPlaceholderDto("A"), new TeamPlaceholderDto("B"),
                        }.ToList(),
                    },
                },
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue",
        };
        var teamC = new TeamDto
        {
            Name = "C",
            Address = "Venue",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB, teamC)
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
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue 1",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue 2",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
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
        var template = new TemplateDto
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
                                new FixtureTemplateDto
                                {
                                    Home = new TeamPlaceholderDto("A"),
                                    Away = new TeamPlaceholderDto("B"),
                                },
                            },
                        },
                        new DateTemplateDto
                        {
                            Fixtures =
                            {
                                new FixtureTemplateDto
                                {
                                    Home = new TeamPlaceholderDto("B"),
                                    Away = new TeamPlaceholderDto("A"),
                                },
                            },
                        },
                    },
                },
            },
        };
        var teamA = new TeamDto
        {
            Name = "A",
            Address = "Venue 1",
        };
        var teamB = new TeamDto
        {
            Name = "B",
            Address = "Venue 2",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
                },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            teamA, teamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenRequestedPlaceholderMappingsToNoExistentTeams_MapsEachTeamToARandomPlaceholder()
    {
        var template = new TemplateDto
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
                                new FixtureTemplateDto
                                {
                                    Home = new TeamPlaceholderDto("A"),
                                    Away = new TeamPlaceholderDto("B"),
                                },
                            },
                        },
                        new DateTemplateDto
                        {
                            Fixtures =
                            {
                                new FixtureTemplateDto
                                {
                                    Home = new TeamPlaceholderDto("B"),
                                    Away = new TeamPlaceholderDto("A"),
                                },
                            },
                        },
                    },
                },
            },
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
            Address = "Venue 1",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
            Address = "Venue 2",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var placeholderMappings = new Dictionary<string, Guid>
        {
            { "A", Guid.NewGuid() },
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
                },
            },
            placeholderMappings);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[]
        {
            teamA, teamB,
        }));
    }

    [Test]
    public async Task AssignAddresses_GivenRequestedPlaceholderMappings_MapsTeamsToGivenPlaceholders()
    {
        var template = new TemplateDto
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
                                new FixtureTemplateDto
                                {
                                    Home = new TeamPlaceholderDto("A"),
                                    Away = new TeamPlaceholderDto("B"),
                                },
                            },
                        },
                        new DateTemplateDto
                        {
                            Fixtures =
                            {
                                new FixtureTemplateDto
                                {
                                    Home = new TeamPlaceholderDto("B"),
                                    Away = new TeamPlaceholderDto("A"),
                                },
                            },
                        },
                    },
                },
            },
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
            Address = "Venue 1",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
            Address = "Venue 2",
        };
        var division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var placeholderMappings = new Dictionary<string, Guid>
        {
            { "A", teamA.Id },
        };
        var context = ProposalContext(
            Array(division1),
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division1.Id, Array(teamA, teamB)
                },
            },
            placeholderMappings);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB));
    }

    private static T[] Array<T>(params T[] items)
    {
        return items;
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
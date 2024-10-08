using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Tests.Models.Dtos;
using CourageScores.Tests.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class AddressAssignmentStrategyTests
{
    private static readonly TeamDto TeamA = new TeamDtoBuilder().WithAddress("Venue").WithName("A").Build();
    private static readonly TeamDto TeamB = new TeamDtoBuilder().WithAddress("Venue").WithName("B").Build();
    private static readonly TeamDto TeamC = new TeamDtoBuilder().WithAddress("Venue").WithName("C").Build();
    private static readonly TeamDto TeamD = new TeamDtoBuilder().WithAddress("Venue 1").WithName("D").Build();
    private static readonly TeamDto TeamE = new TeamDtoBuilder().WithAddress("Venue 2").WithName("E").Build();
    private static readonly DivisionDataDto Division1 = DivisionDataDto("Division 1");
    private static readonly DivisionDataDto Division2 = DivisionDataDto("Division 2");
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
                        Fixtures = { Versus(TeamPlaceholderA, TeamPlaceholderB) },
                    },
                    new DateTemplateDto
                    {
                        Fixtures = { Versus(TeamPlaceholderB, TeamPlaceholderA) },
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
            new[] { Division1, Division2 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA } },
                { Division2.Id, new[] { TeamB } },
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
        var template = new TemplateDtoBuilder()
            .WithSharedAddress(
                List(TeamPlaceholderA, TeamPlaceholderB))
            .WithDivision(
                b => b.WithDates(d => d.WithFixture("A", "D"), d => d.WithFixture("A")),
                b => b.WithDates(d => d.WithFixture("B", "C"), d => d.WithFixture("C")))
            .Build();
        var context = ProposalContext(
            new[] { Division1, Division2 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA } },
                { Division2.Id, new[] { TeamB } },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { TeamA, TeamB }));
    }

    [Test]
    public async Task AssignAddresses_GivenFewerSeasonSharedAddressesThanInTemplate_MapsEachSeasonSharedAddressCorrectly()
    {
        var template = new TemplateDtoBuilder()
            .WithSharedAddress(
                List(TeamPlaceholderB, TeamPlaceholderA),
                List(TeamPlaceholderD, TeamPlaceholderC))
            .WithDivision(
                b => b.WithDates(d => d.WithFixture("A", "C"), d => d.WithFixture("A")),
                b => b.WithDates(d => d.WithFixture("B", "D"), d => d.WithFixture("B")))
            .Build();
        var context = ProposalContext(
            new[] { Division1, Division2 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA } },
                { Division2.Id, new[] { TeamB } },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { TeamA, TeamB }));
    }

    [Test]
    public async Task AssignAddresses_GivenSeasonSharedAddressWithMoreTeamsThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDtoBuilder()
            .WithSharedAddress(
                List(TeamPlaceholderA, TeamPlaceholderB))
            .WithDivision(
                b => b.WithDates(d => d.WithFixture("A", "D"), d => d.WithFixture("A")),
                b => b.WithDates(d => d.WithFixture("D", "B"), d => d.WithFixture("D")),
                b => b.WithDates(d => d.WithFixture("C")))
            .Build();
        var division3 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var context = ProposalContext(
            new[] { Division1, Division2, division3 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA } },
                { Division2.Id, new[] { TeamB } },
                { division3.Id, new[] { TeamC } },
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
        var template = new TemplateDtoBuilder()
            .WithDivision(new DivisionTemplateDto())
            .Build();
        var context = ProposalContext(
            new[] { Division1 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA, TeamB } },
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
            new[] { Division1 },
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA, TeamB } },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA).Or.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB).Or.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { TeamA, TeamB }));
    }

    [Test]
    public async Task AssignAddresses_GivenMissingPreSelectedDivisionSharedAddressesMapping_ReturnsFailure()
    {
        var missingTeamId = Guid.NewGuid();
        var context = ProposalContext(
            new[] { Division1 },
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamB, TeamA } },
            },
            new Dictionary<string, Guid>
            {
                { "A", missingTeamId },
                { "B", TeamA.Id },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[] { $"Could not find team {missingTeamId} in shared address group" }));
    }

    [Test]
    public async Task AssignAddresses_GivenSameNumberOfPreSelectedDivisionSharedAddressesAsInTemplateDivision_MapsEachDivisionSharedAddressCorrectly()
    {
        var context = ProposalContext(
            new[] { Division1 },
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamB, TeamA } },
            },
            new Dictionary<string, Guid>
            {
                { "A", TeamB.Id },
                { "B", TeamA.Id },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamA));
    }

    [Test]
    public async Task AssignAddresses_GivenNoPreSelectedDivisionSharedAddresses_DoesNotMapAnyTeams()
    {
        var context = ProposalContext(
            new[] { Division1 },
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamB, TeamA } },
            },
            new Dictionary<string, Guid>
            {
                { "C", TeamB.Id },
                { "D", TeamA.Id },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamA));
    }

    [Test]
    public async Task AssignAddresses_GivenFewerDivisionSharedAddressesThanInTemplateDivision_MapsEachDivisionSharedAddressCorrectly()
    {
        var template = new TemplateDtoBuilder()
            .WithDivision(b => b.WithSharedAddress(List(TeamPlaceholderA, TeamPlaceholderB), List(TeamPlaceholderC, TeamPlaceholderD)))
            .Build();
        var context = ProposalContext(
            new[] { Division1 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA, TeamB } },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamA).Or.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamB).Or.EqualTo(TeamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { TeamA, TeamB }));
    }

    [Test]
    public async Task AssignAddresses_GivenFewerPreSelectedDivisionSharedAddressesThanInTemplateDivision_MapsEachDivisionSharedAddressCorrectly()
    {
        var template = new TemplateDtoBuilder()
            .WithDivision(b => b.WithSharedAddress(List(TeamPlaceholderA, TeamPlaceholderB), List(TeamPlaceholderC, TeamPlaceholderD)))
            .Build();
        var context = ProposalContext(
            new[] { Division1 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamB, TeamA } },
            },
            new Dictionary<string, Guid>
            {
                { "A", TeamB.Id },
                { "B", TeamA.Id },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamA));
    }

    [Test]
    public async Task AssignAddresses_GivenDivisionSharedAddressWithMoreTeamsThanInTemplate_ReturnsFailure()
    {
        var context = ProposalContext(
            new[] { Division1 },
            ABTemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamA, TeamB, TeamC } },
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
        var template = new TemplateDtoBuilder().WithDivision(new DivisionTemplateDto()).Build();
        var context = ProposalContext(
            new[] { Division1 },
            template,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamD, TeamE } },
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
            new[] { Division1 },
            ABBATemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamD, TeamE } },
            });

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamD).Or.EqualTo(TeamE));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamE).Or.EqualTo(TeamD));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { TeamD, TeamE }));
    }

    [Test]
    public async Task AssignAddresses_GivenRequestedPlaceholderMappingsToNoExistentTeams_MapsEachTeamToARandomPlaceholder()
    {
        var placeholderMappings = new Dictionary<string, Guid>
        {
            { "A", Guid.NewGuid() },
        };
        var context = ProposalContext(
            new[] { Division1 },
            ABBATemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamD, TeamE } },
            },
            placeholderMappings);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(TeamD).Or.EqualTo(TeamE));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(TeamE).Or.EqualTo(TeamD));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { TeamD, TeamE }));
    }

    [Test]
    public async Task AssignAddresses_GivenRequestedPlaceholderMappings_MapsTeamsToGivenPlaceholders()
    {
        var placeholderMappings = new Dictionary<string, Guid>
        {
            { "A", TeamD.Id },
        };
        var context = ProposalContext(
            new[] { Division1 },
            ABBATemplate,
            new Dictionary<Guid, TeamDto[]>
            {
                { Division1.Id, new[] { TeamD, TeamE } },
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

    private static DivisionDataDto DivisionDataDto(string name)
    {
        return new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = name,
        };
    }
}
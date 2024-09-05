using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Tests.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class FixtureDateAssignmentStrategyTests
{
    private static readonly TeamDto Team1 = new TeamDtoBuilder().WithName("Team 1").Build();
    private static readonly TeamDto Team2 = new TeamDtoBuilder().WithName("Team 2").Build();
    private static readonly TeamDto Team3 = new TeamDtoBuilder().WithName("Team 3").Build();
    private static readonly TeamDto Team4 = new TeamDtoBuilder().WithName("Team 4").Build();
    private static readonly SeasonDto Season = new SeasonDtoBuilder()
        .WithDates(new DateTime(2001, 01, 01), new DateTime(2001, 09, 01))
        .Build();
    private readonly IEqualityComparer<DivisionDataDto> _comparer = new DateAndTeamNameComparer();
    private readonly CancellationToken _token = new();
    private readonly Dictionary<string, TeamDto> _placeholderMappings = new()
    {
        { "A", Team1 },
        { "B", Team2 },
        { "C", Team3 },
        { "D", Team4 },
    };
    private readonly FixtureDateAssignmentStrategy _strategy = new();

    private DivisionDataDto _division1 = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
    }

    [Test]
    public async Task AssignDates_GivenNoTemplateDates_ReturnSuccessful()
    {
        var template = Template(new DivisionTemplateDto());
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { _division1 }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task AssignDates_GivenNoDivisions_ReturnSuccessful()
    {
        var template = Template();
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(Array.Empty<DivisionDataDto>(), template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task AssignDates_GivenHomeTeamIsNotFound_ReturnsUnsuccessful()
    {
        var template = Template(TemplateDivision(TemplateDate(TemplateFixture("J", "B"))));
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { _division1 }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Could not find home team for fixture - J",
        }));
    }

    [Test]
    public async Task AssignDates_GivenAwayTeamIsNotFound_ReturnsUnsuccessful()
    {
        var template = Template(TemplateDivision(TemplateDate(TemplateFixture("A", "J"))));
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { _division1 }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[]
        {
            "Could not find away team for fixture - J",
        }));
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndNoExistingDates_CreatesDatesFromSeasonStartDate()
    {
        var template = Template(TemplateDivision(
            TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
            TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))));
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { _division1 }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions!.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                OutputDate(new DateTime(2001, 01, 08), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndNotesOnSomeDates_SkipsDatesWithNotes()
    {
        var template = Template(TemplateDivision(
            TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
            TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))));
        var dateWithNote = new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 01, 08),
            Notes = { new FixtureDateNoteDto() },
        };
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Fixtures = { dateWithNote },
        };
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { division }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions!.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                dateWithNote,
                OutputDate(new DateTime(2001, 01, 15), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenMultipleDivisionsAndNoExistingDate_CreatesDatesFromSeasonStartDateForAllDivisions()
    {
        var template = Template(
            TemplateDivision(
                TemplateDate(TemplateFixture("A", "B")),
                TemplateDate(TemplateFixture("B", "A"))
            ),
            TemplateDivision(
                TemplateDate(TemplateFixture("C", "D")),
                TemplateDate(TemplateFixture("D", "C"))
            ));
        var division2 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { _division1, division2 }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions!.Count, Is.EqualTo(2));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2)),
                OutputDate(new DateTime(2001, 01, 08), OutputFixture(Team2, Team1)))).Using(_comparer));
        Assert.That(
            context.Result.Result!.Divisions[1],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team3, Team4)),
                OutputDate(new DateTime(2001, 01, 08), OutputFixture(Team4, Team3)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndKnockoutFixturesOnSomeDates_SkipsDatesWithKnockoutFixtures()
    {
        var template = Template(TemplateDivision(
            TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
            TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))));
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Fixtures =
            {
                OutputDate(new DateTime(2001, 01, 08), new DivisionFixtureDto { IsKnockout = true }),
            },
        };
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { division }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions!.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                OutputDate(new DateTime(2001, 01, 08), new DivisionFixtureDto { IsKnockout = true }),
                OutputDate(new DateTime(2001, 01, 15), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndTournamentFixturesOnSomeDates_SkipsDatesWithTournamentFixtures()
    {
        var template = Template(TemplateDivision(
            TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
            TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))));
        var dateWithTournament = new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 01, 08),
            TournamentFixtures = { new DivisionTournamentFixtureDetailsDto() },
        };
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Fixtures = { dateWithTournament },
        };
        var teams = new Dictionary<Guid, TeamDto[]>();
        var context = ProposalContext(new[] { division }, template, teams);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions!.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                dateWithTournament,
                OutputDate(new DateTime(2001, 01, 15), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    private ProposalContext ProposalContext(IReadOnlyCollection<DivisionDataDto> divisions, TemplateDto template, Dictionary<Guid, TeamDto[]> teams)
    {
        return new ProposalContext(
            new TemplateMatchContext(Season, divisions, teams, new Dictionary<string, Guid>()),
            template,
            new ActionResultDto<ProposalResultDto>
            {
                Result = new ProposalResultDto
                {
                    PlaceholderMappings = _placeholderMappings,
                    Divisions = divisions.ToList(),
                },
            });
    }

    private static TemplateDto Template(params DivisionTemplateDto[] divisions)
    {
        return new TemplateDto
        {
            Divisions = divisions.ToList(),
        };
    }

    private static DivisionTemplateDto TemplateDivision(params DateTemplateDto[] dates)
    {
        return new DivisionTemplateDto
        {
            Dates = dates.ToList(),
        };
    }

    private static DateTemplateDto TemplateDate(params FixtureTemplateDto[] fixtures)
    {
        return new DateTemplateDto
        {
            Fixtures = fixtures.ToList(),
        };
    }

    private static FixtureTemplateDto TemplateFixture(string home, string? away)
    {
        return new FixtureTemplateDto
        {
            Home = new TeamPlaceholderDto(home),
            Away = away != null ? new TeamPlaceholderDto(away) : null,
        };
    }

    private static DivisionFixtureDto OutputFixture(TeamDto home, TeamDto? away)
    {
        return new DivisionFixtureDto
        {
            HomeTeam = new DivisionFixtureTeamDto
            {
                Name = home.Name,
            },
            AwayTeam = away != null
                ? new DivisionFixtureTeamDto
                {
                    Name = away.Name,
                }
                : null,
        };
    }

    private static DivisionFixtureDateDto OutputDate(DateTime date, params DivisionFixtureDto[] fixtures)
    {
        return new DivisionFixtureDateDto
        {
            Date = date,
            Fixtures = fixtures.ToList(),
        };
    }

    private static DivisionDataDto OutputDivision(params DivisionFixtureDateDto[] dates)
    {
        return new DivisionDataDto
        {
            Fixtures = dates.ToList(),
        };
    }

    private class DateAndTeamNameComparer : IEqualityComparer<DivisionDataDto>
    {
        public bool Equals(DivisionDataDto? x, DivisionDataDto? y)
        {
            if (x == null && y == null)
            {
                return true;
            }

            if (x == null || y == null)
            {
                return false;
            }

            if (x.Fixtures.Count != y.Fixtures.Count)
            {
                return false;
            }

            foreach (var tuple in x.Fixtures.Zip(y.Fixtures))
            {
                if (tuple.First.Date != tuple.Second.Date)
                {
                    return false;
                }

                return FixturesEqual(tuple.First.Fixtures, tuple.Second.Fixtures);
            }

            return true;
        }

        private static bool FixturesEqual(IReadOnlyCollection<DivisionFixtureDto> x, IReadOnlyCollection<DivisionFixtureDto> y)
        {
            if (x.Count != y.Count)
            {
                return false;
            }

            foreach (var tuple in x.Zip(y))
            {
                if (tuple.First.HomeTeam.Name != tuple.Second.HomeTeam.Name)
                {
                    return false;
                }

                if (tuple.First.AwayTeam == null && tuple.Second.AwayTeam == null)
                {
                    continue;
                }

                if (tuple.First.AwayTeam == null && tuple.Second.AwayTeam != null || tuple.First.AwayTeam != null && tuple.Second.AwayTeam == null)
                {
                    return false;
                }

                if (tuple.First.AwayTeam!.Name != tuple.Second.AwayTeam!.Name)
                {
                    return false;
                }
            }

            return true;
        }

        public int GetHashCode(DivisionDataDto obj)
        {
            return 0;
        }
    }
}
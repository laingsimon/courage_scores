using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class FixtureDateAssignmentStrategyTests
{
    private static readonly DivisionTeamDto Team1 = new DivisionTeamDto { Id = Guid.NewGuid(), Name = "Team 1" };
    private static readonly DivisionTeamDto Team2 = new DivisionTeamDto { Id = Guid.NewGuid(), Name = "Team 2" };
    private static readonly DivisionTeamDto Team3 = new DivisionTeamDto { Id = Guid.NewGuid(), Name = "Team 3" };
    private static readonly DivisionTeamDto Team4 = new DivisionTeamDto { Id = Guid.NewGuid(), Name = "Team 4" };
    private readonly IEqualityComparer<DivisionDataDto> _comparer = new DateAndTeamNameComparer();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly Dictionary<string, DivisionTeamDto> _placeholderMappings = new Dictionary<string, DivisionTeamDto>
    {
        { "A", Team1 },
        { "B", Team2 },
        { "C", Team3 },
        { "D", Team4 },
    };
    private readonly FixtureDateAssignmentStrategy _strategy = new FixtureDateAssignmentStrategy();
    private SeasonDto _season = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _season = new SeasonDto
        {
            StartDate = new DateTime(2001, 01, 01),
        };
    }

    [Test]
    public async Task AssignDates_GivenNoTemplateDates_ReturnSuccessful()
    {
        var template = new TemplateDto
        {
            Divisions = { new DivisionTemplateDto() }
        };
        var division = new DivisionDataDto();
        var context = ProposalContext(new[] { division }, template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task AssignDates_GivenNoDivisions_ReturnSuccessful()
    {
        var template = new TemplateDto();
        var context = ProposalContext(Array.Empty<DivisionDataDto>(), template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndNoExistingDates_CreatesDatesFromSeasonStartDate()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                TemplateDivision(
                    TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
                    TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))
                ),
            }
        };
        var division = new DivisionDataDto();
        var context = ProposalContext(new[] { division }, template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                OutputDate(new DateTime(2001, 01, 08), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndNotesOnSomeDates_SkipsDatesWithNotes()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                TemplateDivision(
                    TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
                    TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))
                ),
            }
        };
        var division = new DivisionDataDto
        {
            Fixtures =
            {
                new DivisionFixtureDateDto
                {
                    Date = new DateTime(2001, 01, 08),
                    Notes = { new FixtureDateNoteDto() }
                }
            }
        };
        var context = ProposalContext(new[] { division }, template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                new DivisionFixtureDateDto
                {
                    Date = new DateTime(2001, 01, 08),
                    Notes = { new FixtureDateNoteDto() }
                },
                OutputDate(new DateTime(2001, 01, 15), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenMultipleDivisionsAndNoExistingDate_CreatesDatesFromSeasonStartDateForAllDivisions()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                TemplateDivision(
                    TemplateDate(TemplateFixture("A", "B")),
                    TemplateDate(TemplateFixture("B", "A"))
                ),
                TemplateDivision(
                    TemplateDate(TemplateFixture("C", "D")),
                    TemplateDate(TemplateFixture("D", "C"))
                ),
            }
        };
        var division1 = new DivisionDataDto();
        var division2 = new DivisionDataDto();
        var context = ProposalContext(new[] { division1, division2 }, template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions.Count, Is.EqualTo(2));
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
        var template = new TemplateDto
        {
            Divisions =
            {
                TemplateDivision(
                    TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
                    TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))
                ),
            }
        };
        var division = new DivisionDataDto
        {
            Fixtures =
            {
                new DivisionFixtureDateDto
                {
                    Date = new DateTime(2001, 01, 08),
                    Fixtures = { new DivisionFixtureDto { IsKnockout = true } }
                }
            }
        };
        var context = ProposalContext(new[] { division }, template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                new DivisionFixtureDateDto
                {
                    Date = new DateTime(2001, 01, 08),
                    Fixtures = { new DivisionFixtureDto { IsKnockout = true } }
                },
                OutputDate(new DateTime(2001, 01, 15), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    [Test]
    public async Task AssignDates_GivenSingleDivisionAndTournamentFixturesOnSomeDates_SkipsDatesWithTournamentFixtures()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                TemplateDivision(
                    TemplateDate(TemplateFixture("A", "B"), TemplateFixture("C", "D")),
                    TemplateDate(TemplateFixture("B", "C"), TemplateFixture("D", "A"))
                ),
            }
        };
        var division = new DivisionDataDto
        {
            Fixtures =
            {
                new DivisionFixtureDateDto
                {
                    Date = new DateTime(2001, 01, 08),
                    TournamentFixtures = { new DivisionTournamentFixtureDetailsDto() }
                }
            }
        };
        var context = ProposalContext(new[] { division }, template);

        var result = await _strategy.AssignDates(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.Result.Result!.Divisions.Count, Is.EqualTo(1));
        Assert.That(
            context.Result.Result!.Divisions[0],
            Is.EqualTo(OutputDivision(
                OutputDate(new DateTime(2001, 01, 01), OutputFixture(Team1, Team2), OutputFixture(Team3, Team4)),
                new DivisionFixtureDateDto
                {
                    Date = new DateTime(2001, 01, 08),
                    TournamentFixtures = { new DivisionTournamentFixtureDetailsDto() }
                },
                OutputDate(new DateTime(2001, 01, 15), OutputFixture(Team2, Team3), OutputFixture(Team4, Team1)))).Using(_comparer));
    }

    private ProposalContext ProposalContext(IReadOnlyCollection<DivisionDataDto> divisions, TemplateDto template)
    {
        return new ProposalContext(
            new TemplateMatchContext(_season, divisions),
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

    private static DivisionFixtureDto OutputFixture(DivisionTeamDto home, DivisionTeamDto? away)
    {
        return new DivisionFixtureDto
        {
            HomeTeam = new DivisionFixtureTeamDto { Name = home.Name },
            AwayTeam = away != null ? new DivisionFixtureTeamDto { Name = away.Name } : null,
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

                if ((tuple.First.AwayTeam == null && tuple.Second.AwayTeam != null) || (tuple.First.AwayTeam != null && tuple.Second.AwayTeam == null))
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
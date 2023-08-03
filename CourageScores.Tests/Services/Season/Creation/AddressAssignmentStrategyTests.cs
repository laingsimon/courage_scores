using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class AddressAssignmentStrategyTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly AddressAssignmentStrategy _strategy = new AddressAssignmentStrategy();
    private readonly SeasonDto _season = new SeasonDto();

    [Test]
    public async Task AssignAddresses_GivenMoreSeasonSharedAddressesThanInTemplate_ReturnsFailure()
    {
        var template = new TemplateDto();
        var division1 = new DivisionDataDto
        {
            Teams = { new DivisionTeamDto { Address = "Venue" } }
        };
        var division2 = new DivisionDataDto
        {
            Teams = { new DivisionTeamDto { Address = "Venue" } }
        };
        var context = ProposalContext(new[] { division1, division2 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[] { "Too many teams in the season with addresses shared across the divisions" }));
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
                    new TeamPlaceholderDto("A"),
                    new TeamPlaceholderDto("B")
                }.ToList(),
            }
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var division1 = new DivisionDataDto { Teams = { teamA } };
        var division2 = new DivisionDataDto { Teams = { teamB } };
        var context = ProposalContext(new[] { division1, division2 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { teamA, teamB }));
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
                    new TeamPlaceholderDto("A"),
                    new TeamPlaceholderDto("B")
                }.ToList(),
                new[]
                {
                    new TeamPlaceholderDto("C"),
                    new TeamPlaceholderDto("D")
                }.ToList(),
            }
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var division1 = new DivisionDataDto { Teams = { teamA } };
        var division2 = new DivisionDataDto { Teams = { teamB } };
        var context = ProposalContext(new[] { division1, division2 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { teamA, teamB }));
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
                    new TeamPlaceholderDto("A"),
                    new TeamPlaceholderDto("B")
                }.ToList(),
            }
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var teamC = new DivisionTeamDto { Name = "C", Address = "Venue" };
        var division1 = new DivisionDataDto { Teams = { teamA } };
        var division2 = new DivisionDataDto { Teams = { teamB } };
        var division3 = new DivisionDataDto { Teams = { teamC } };
        var context = ProposalContext(new[] { division1, division2, division3 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[] { "Shared address has more teams than the template supports" }));
    }

    [Test]
    public async Task AssignAddresses_GivenMoreDivisionSharedAddressesThanInTemplateDivision_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto()
            },
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var division1 = new DivisionDataDto
        {
            Name = "Division 1",
            Teams = { teamA, teamB }
        };
        var context = ProposalContext(new[] { division1 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[] { "Division 1: Too many teams with addresses shared" }));
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
                            new TeamPlaceholderDto("A"),
                            new TeamPlaceholderDto("B")
                        }.ToList(),
                    }
                }
            },
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var division1 = new DivisionDataDto
        {
            Name = "Division 1",
            Teams = { teamA, teamB }
        };

        var context = ProposalContext(new[] { division1 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { teamA, teamB }));
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
                            new TeamPlaceholderDto("A"),
                            new TeamPlaceholderDto("B")
                        }.ToList(),
                        new[]
                        {
                            new TeamPlaceholderDto("C"),
                            new TeamPlaceholderDto("D")
                        }.ToList(),
                    }
                }
            },
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var division1 = new DivisionDataDto
        {
            Name = "Division 1",
            Teams = { teamA, teamB }
        };
        var context = ProposalContext(new[] { division1 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { teamA, teamB }));
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
                            new TeamPlaceholderDto("A"),
                            new TeamPlaceholderDto("B")
                        }.ToList(),
                    }
                },
            },
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue" };
        var teamC = new DivisionTeamDto { Name = "C", Address = "Venue" };
        var division1 = new DivisionDataDto
        {
            Name = "Division 1",
            Teams = { teamA, teamB, teamC }
        };
        var context = ProposalContext(new[] { division1 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[] { "Division 1: Shared address has more teams than the template supports" }));
    }

    [Test]
    public async Task AssignAddresses_GivenInsufficientNonSharedAddressPlaceholdes_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto()
            },
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue 1" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue 2" };
        var division1 = new DivisionDataDto
        {
            Name = "Division 1",
            Teams = { teamA, teamB }
        };
        var context = ProposalContext(new[] { division1 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.False);
        Assert.That(context.Result.Errors, Is.EquivalentTo(new[] { "Division 1: More teams in division than templates support" }));
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
                                new FixtureTemplateDto { Home = new TeamPlaceholderDto("A"), Away = new TeamPlaceholderDto("B") },
                            }
                        },
                        new DateTemplateDto
                        {
                            Fixtures =
                            {
                                new FixtureTemplateDto { Home = new TeamPlaceholderDto("B"), Away = new TeamPlaceholderDto("A") },
                            }
                        }
                    }
                }
            },
        };
        var teamA = new DivisionTeamDto { Name = "A", Address = "Venue 1" };
        var teamB = new DivisionTeamDto { Name = "B", Address = "Venue 2" };
        var division1 = new DivisionDataDto
        {
            Name = "Division 1",
            Teams = { teamA, teamB }
        };
        var context = ProposalContext(new[] { division1 }, template);

        var result = await _strategy.AssignAddresses(context, _token);

        Assert.That(result, Is.True);
        Assert.That(context.PlaceholderMapping["A"], Is.EqualTo(teamA).Or.EqualTo(teamB));
        Assert.That(context.PlaceholderMapping["B"], Is.EqualTo(teamB).Or.EqualTo(teamA));
        Assert.That(context.PlaceholderMapping.Values, Is.EquivalentTo(new[] { teamA, teamB }));
    }

    private ProposalContext ProposalContext(IEnumerable<DivisionDataDto> divisions, TemplateDto template)
    {
        return new ProposalContext(
            new TemplateMatchContext(_season, divisions),
            template,
            new ActionResultDto<ProposalResultDto>
            {
                Result = new ProposalResultDto(),
            });
    }
}
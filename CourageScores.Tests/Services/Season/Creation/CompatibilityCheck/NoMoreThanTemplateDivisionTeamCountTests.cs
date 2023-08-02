using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class NoMoreThanTemplateDivisionTeamCountTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonDto _season = new SeasonDto();
    private readonly NoMoreThanTemplateDivisionTeamCount _check = new NoMoreThanTemplateDivisionTeamCount();

    [Test]
    public async Task Check_GivenFewerTeamsInADivisionThanTemplate_ReturnsTemplateCompatible()
    {
        var template = new TemplateDto
        {
            Name = "1 division template",
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
                                    Home = new TeamPlaceholderDto("H"),
                                    Away = new TeamPlaceholderDto("A"),
                                },
                            }
                        }
                    }
                },
            }
        }; // template has 2 teams
        var division = new DivisionDataDto
        {
            Teams =
            {
                new DivisionTeamDto(),
            } // division has 1 team
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenByeFixturesInTemplate_DoesNotThrow()
    {
        var template = new TemplateDto
        {
            Name = "1 division template",
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
                                    Home = new TeamPlaceholderDto("H"),
                                },
                            }
                        }
                    }
                },
            }
        }; // template has 1 team
        var division = new DivisionDataDto
        {
            Teams =
            {
                new DivisionTeamDto(),
            } // division has 1 team
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenSameNumberOfTeamsInADivisionAsTemplate_ReturnsTemplateCompatible()
    {
        var template = new TemplateDto
        {
            Name = "1 division template",
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
                                    Home = new TeamPlaceholderDto("H"),
                                    Away = new TeamPlaceholderDto("A"),
                                },
                            }
                        }
                    }
                },
            }
        }; // template has 2 teams
        var division = new DivisionDataDto
        {
            Teams =
            {
                new DivisionTeamDto(),
                new DivisionTeamDto(),
            } // division has 2 teams
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenMoreTeamsInADivisionThenTemplate_ReturnsTemplateIncompatible()
    {
        var template = new TemplateDto
        {
            Name = "1 division template",
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
                                    Home = new TeamPlaceholderDto("H"),
                                    Away = new TeamPlaceholderDto("A"),
                                },
                            }
                        }
                    }
                },
            }
        }; // template has 2 teams
        var division = new DivisionDataDto
        {
            Name = "Division One",
            Teams =
            {
                new DivisionTeamDto(),
                new DivisionTeamDto(),
                new DivisionTeamDto(),
            } // division has 3 teams
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Division One has 3 teams, template has fewer (2)" }));
    }
}
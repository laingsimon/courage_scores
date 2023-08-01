using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class EachDivisionHasRightNumberOfTeamsWithSharedAddressTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonDto _season = new SeasonDto();
    private readonly EachDivisionHasRightNumberOfTeamsWithSharedAddress _check = new EachDivisionHasRightNumberOfTeamsWithSharedAddress();

    [Test]
    public async Task Check_GivenNoRequiredSharedAddressesAndNonePresent_ReturnsSuccess()
    {
        var template = new TemplateDto();
        var division = new DivisionDataDto
        {
            Teams =
            {
                new DivisionTeamDto { Name = "A", Address = "A" },
                new DivisionTeamDto { Name = "B", Address = "B" },
            }
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenNoSharedAddressAndSomeSupported_ReturnsSuccess()
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
                            new TeamPlaceholderDto("a"),
                            new TeamPlaceholderDto("b")
                        }.ToList(),
                    }
                }
            }
        };
        var division = new DivisionDataDto
        {
            Teams =
            {
                new DivisionTeamDto { Name = "A", Address = "A" },
                new DivisionTeamDto { Name = "B", Address = "B" },
            }
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenMatchingNumberRequiredSharedAddresses_ReturnsSuccess()
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
                            new TeamPlaceholderDto("a"),
                            new TeamPlaceholderDto("b")
                        }.ToList(),
                    }
                }
            }
        };
        var division = new DivisionDataDto
        {
            Teams =
            {
                new DivisionTeamDto { Name = "A", Address = "A" },
                new DivisionTeamDto { Name = "B", Address = "A" },
            }
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenDivisionHasMoreSharedAddressesThenSupported_ReturnsFailure()
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
                            new TeamPlaceholderDto("a"),
                            new TeamPlaceholderDto("b")
                        }.ToList(),
                    }
                }
            }
        };
        var division = new DivisionDataDto
        {
            Name = "Division One",
            Teams =
            {
                new DivisionTeamDto { Name = "A", Address = "A" },
                new DivisionTeamDto { Name = "B", Address = "A" },
                new DivisionTeamDto { Name = "C", Address = "C" },
                new DivisionTeamDto { Name = "D", Address = "C" },
            }
        };

        var result = await _check.Check(template, new TemplateMatchContext(_season, new[] { division }), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Division One has 2 shared addresses, template only supports 1" }));
    }
}
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class EachDivisionHasRightNumberOfTeamsWithSharedAddressTests
{
    private readonly CancellationToken _token = new();
    private readonly SeasonDto _season = new();
    private readonly EachDivisionHasRightNumberOfTeamsWithSharedAddress _check = new();

    [Test]
    public async Task Check_GivenNoRequiredSharedAddressesAndNonePresent_ReturnsSuccess()
    {
        var template = new TemplateDto();
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var teams = new[]
        {
            new TeamDto
            {
                Name = "A",
                Address = "A",
            },
            new TeamDto
            {
                Name = "B",
                Address = "B",
            },
        };

        var result = await _check.Check(template, TemplateMatchContext(division, teams), _token);

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
                            new TeamPlaceholderDto("a"), new TeamPlaceholderDto("b"),
                        }.ToList(),
                    },
                },
            },
        };
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var teams = new[]
        {
            new TeamDto
            {
                Name = "A",
                Address = "A",
            },
            new TeamDto
            {
                Name = "B",
                Address = "B",
            },
        };

        var result = await _check.Check(template, TemplateMatchContext(division, teams), _token);

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
                            new TeamPlaceholderDto("a"), new TeamPlaceholderDto("b"),
                        }.ToList(),
                    },
                },
            },
        };
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        var teams = new[]
        {
            new TeamDto
            {
                Name = "A",
                Address = "A",
            },
            new TeamDto
            {
                Name = "B",
                Address = "A",
            },
        };

        var result = await _check.Check(template, TemplateMatchContext(division, teams), _token);

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
                            new TeamPlaceholderDto("a"), new TeamPlaceholderDto("b"),
                        }.ToList(),
                    },
                },
            },
        };
        var division = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "Division One",
        };
        var teams = new[]
        {
            new TeamDto
            {
                Name = "A",
                Address = "A",
            },
            new TeamDto
            {
                Name = "B",
                Address = "A",
            },
            new TeamDto
            {
                Name = "C",
                Address = "C",
            },
            new TeamDto
            {
                Name = "D",
                Address = "C",
            },
        };

        var result = await _check.Check(template, TemplateMatchContext(division, teams), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "Division One has 2 shared addresses, template only supports 1",
        }));
    }

    private TemplateMatchContext TemplateMatchContext(DivisionDataDto division, TeamDto[] teams)
    {
        return new TemplateMatchContext(
            _season,
            new[]
            {
                division,
            },
            new Dictionary<Guid, TeamDto[]>
            {
                {
                    division.Id, teams
                },
            });
    }
}
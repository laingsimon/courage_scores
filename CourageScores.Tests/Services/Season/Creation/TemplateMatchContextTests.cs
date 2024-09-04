using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Tests.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class TemplateMatchContextTests
{
    private static readonly TeamDto TeamA = new TeamDtoBuilder().WithAddress("A").Build();
    private static readonly TeamDto TeamALowerCase = new TeamDtoBuilder().WithAddress("a").Build();
    private static readonly TeamDto TeamB = new TeamDtoBuilder().WithAddress("B").Build();
    private static readonly TeamDto TeamC = new TeamDtoBuilder().WithAddress("C").Build();

    private static readonly DivisionDataDto Division1 = new DivisionDataDto
    {
        Id = Guid.NewGuid(),
    };
    private static readonly DivisionDataDto Division2 = new DivisionDataDto
    {
        Id = Guid.NewGuid(),
    };

    private readonly SeasonDto _season = new();

    [Test]
    public void GetSeasonSharedAddresses_GivenNoDivisions_ReturnsEmpty()
    {
        var context = new TemplateMatchContext(_season, Array.Empty<DivisionDataDto>(), new Dictionary<Guid, TeamDto[]>(), new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenTeams_ReturnsEmpty()
    {
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1 },
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenAllTeamsWithDifferentAddresses_ReturnsEmpty()
    {
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            {
                Division1.Id, new[] { TeamA, TeamB }
            },
        };
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1 },
            teams,
            new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesInADivision_ReturnsEmpty()
    {
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            {
                Division1.Id, new[] { TeamA, TeamB, TeamC }
            },
        };
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1 },
            teams,
            new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesAcrossDivisions_ReturnsSharedAddresses()
    {
        var teamC2 = new TeamDtoBuilder().WithAddress("C").Build();
        var teamB2 = new TeamDtoBuilder().WithAddress("B").Build();
        var teamC3 = new TeamDtoBuilder().WithAddress("C").Build();
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            {
                Division1.Id, new[] { TeamA, TeamB, TeamC }
            },
            {
                Division2.Id, new[] { teamC2, teamB2, teamC3 }
            },
        };
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1, Division2 },
            teams,
            new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.EquivalentTo(new[]
        {
            new[] { "B", "B" },
        }));
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesAcrossDivisionsIncludingWhitespace_ReturnsSharedAddresses()
    {
        var teamC2 = new TeamDtoBuilder().WithAddress("C").Build();
        var teamB2 = new TeamDtoBuilder().WithAddress("B").Build();
        var teamC3WithWhiteSpace = new TeamDtoBuilder().WithAddress("C ").Build();
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            {
                Division1.Id, new[] { TeamA, TeamB, TeamC }
            },
            {
                Division2.Id, new[] { teamC2, teamB2, teamC3WithWhiteSpace }
            },
        };
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1, Division2 },
            teams,
            new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.EquivalentTo(new[]
        {
            new[] { "B", "B" },
        }));
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesAcrossDivisionsInDifferentCase_ReturnsSharedAddresses()
    {
        var teamC2 = new TeamDtoBuilder().WithAddress("C").Build();
        var teamBLowerCase = new TeamDtoBuilder().WithAddress("b").Build();
        var teamCLowerCase = new TeamDtoBuilder().WithAddress("c").Build();
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            {
                Division1.Id, new[] { TeamA, TeamB, TeamALowerCase }
            },
            {
                Division2.Id, new[] { teamC2, teamBLowerCase, teamCLowerCase }
            },
        };
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1, Division2 },
            teams,
            new Dictionary<string, Guid>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.EquivalentTo(new[]
        {
            new[] { "B", "b" },
        }));
    }

    [Test]
    public void GetDivisionMappings_GivenNoDivisionsAnywhere_ReturnsEmpty()
    {
        var context = new TemplateMatchContext(
            _season,
            Array.Empty<DivisionDataDto>(),
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = context.GetDivisionMappings(new TemplateDto());

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetDivisionMappings_GivenSeasonDivisions_ReturnsEmpty()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto(),
            },
        };
        var context = new TemplateMatchContext(
            _season,
            Array.Empty<DivisionDataDto>(),
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = context.GetDivisionMappings(template);

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetDivisionMappings_GivenTemplateDivisions_ReturnsEmpty()
    {
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1 },
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = context.GetDivisionMappings(new TemplateDto());

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetDivisionMappings_GivenDivisions_ReturnsMappings()
    {
        var template = new TemplateDto
        {
            Divisions =
            {
                new DivisionTemplateDto(),
            },
        };
        var context = new TemplateMatchContext(
            _season,
            new[] { Division1 },
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = context.GetDivisionMappings(template).ToArray();

        Assert.That(result.Length, Is.EqualTo(1));
        Assert.That(result[0].SeasonDivision, Is.SameAs(Division1));
        Assert.That(result[0].TemplateDivision, Is.SameAs(template.Divisions[0]));
    }

    [Test]
    public void SharedAddressesFromSeason_GivenNoTeams_ReturnsEmpty()
    {
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(
            seasonDivision,
            templateDivision,
            Array.Empty<TeamDto>());

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void SharedAddressesFromSeason_GivenUniqueAddressesForEachTeam_ReturnsEmpty()
    {
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(
            seasonDivision,
            templateDivision,
            new[] { TeamA, TeamB, TeamC });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void SharedAddressesFromSeason_GivenSomeSharedAddresses_ReturnsTeamsWithSharedAddress()
    {
        var teamA2 = new TeamDtoBuilder().WithAddress("A").Build();
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(
            seasonDivision,
            templateDivision,
            new[] { TeamA, TeamB, teamA2 });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.EquivalentTo(new[]
        {
            new[] { TeamA, teamA2 },
        }));
    }

    [Test]
    public void SharedAddressesFromSeason_GivenSomeSharedAddressesIncludingWhitespace_ReturnsTeamsWithSharedAddress()
    {
        var teamAWithWhiteSpace = new TeamDtoBuilder().WithAddress("A ").Build();
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(
            seasonDivision,
            templateDivision,
            new[] { TeamA, TeamB, teamAWithWhiteSpace });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.EquivalentTo(new[]
        {
            new[] { TeamA, teamAWithWhiteSpace },
        }));
    }

    [Test]
    public void SharedAddressesFromSeason_GivenSomeSharedAddressesDifferentCase_ReturnsTeamsWithSharedAddress()
    {
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(
            seasonDivision,
            templateDivision,
            new[] { TeamA, TeamB, TeamALowerCase });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.EquivalentTo(new[]
        {
            new[] { TeamA, TeamALowerCase },
        }));
    }
}
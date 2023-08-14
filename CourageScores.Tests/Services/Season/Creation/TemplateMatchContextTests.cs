using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class TemplateMatchContextTests
{
    private readonly SeasonDto _season = new SeasonDto();

    [Test]
    public void GetSeasonSharedAddresses_GivenNoDivisions_ReturnsEmpty()
    {
        var context = new TemplateMatchContext(_season, Array.Empty<DivisionDataDto>(), new Dictionary<Guid, TeamDto[]>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenTeams_ReturnsEmpty()
    {
        var division = new DivisionDataDto { Id = Guid.NewGuid() };
        var context = new TemplateMatchContext(_season, new[] { division }, new Dictionary<Guid, TeamDto[]>());

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenAllTeamsWithDifferentAddresses_ReturnsEmpty()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var division = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division.Id, new[] { team1, team2 } }
        };
        var context = new TemplateMatchContext(_season, new[] { division }, teams);

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesInADivision_ReturnsEmpty()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "A" };
        var division = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division.Id, new[] { team1, team2, team3 } }
        };
        var context = new TemplateMatchContext(_season, new[] { division }, teams);

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesAcrossDivisions_ReturnsSharedAddresses()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "A" };
        var team4 = new TeamDto { Address = "C" };
        var team5 = new TeamDto { Address = "B" };
        var team6 = new TeamDto { Address = "C" };
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { team1, team2, team3 } },
            { division2.Id, new[] { team4, team5, team6 } },
        };
        var context = new TemplateMatchContext(_season, new[] { division1, division2 }, teams);

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.EquivalentTo(new[] { new[] { "B", "B" } }));
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesAcrossDivisionsIncludingWhitespace_ReturnsSharedAddresses()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B " };
        var team3 = new TeamDto { Address = "A " };
        var team4 = new TeamDto { Address = "C" };
        var team5 = new TeamDto { Address = "B" };
        var team6 = new TeamDto { Address = "C " };
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { team1, team2, team3 } },
            { division2.Id, new[] { team4, team5, team6 } },
        };
        var context = new TemplateMatchContext(_season, new[] { division1, division2 }, teams);

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.EquivalentTo(new[] { new[] { "B", "B" } }));
    }

    [Test]
    public void GetSeasonSharedAddresses_GivenSomeTeamsWithSharedAddressesAcrossDivisionsInDifferentCase_ReturnsSharedAddresses()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "a" };
        var team4 = new TeamDto { Address = "C" };
        var team5 = new TeamDto { Address = "b" };
        var team6 = new TeamDto { Address = "c" };
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { team1, team2, team3 } },
            { division2.Id, new[] { team4, team5, team6 } },
        };
        var context = new TemplateMatchContext(_season, new[] { division1, division2 }, teams);

        var result = context.GetSeasonSharedAddresses();

        Assert.That(result, Is.EquivalentTo(new[] { new[] { "B", "b" } }));
    }

    [Test]
    public void GetDivisionMappings_GivenNoDivisionsAnywhere_ReturnsEmpty()
    {
        var context = new TemplateMatchContext(_season, Array.Empty<DivisionDataDto>(), new Dictionary<Guid, TeamDto[]>());

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
                new DivisionTemplateDto()
            }
        };
        var context = new TemplateMatchContext(_season, Array.Empty<DivisionDataDto>(), new Dictionary<Guid, TeamDto[]>());

        var result = context.GetDivisionMappings(template);

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetDivisionMappings_GivenTemplateDivisions_ReturnsEmpty()
    {
        var division = new DivisionDataDto { Id = Guid.NewGuid() };
        var context = new TemplateMatchContext(_season, new[] { division }, new Dictionary<Guid, TeamDto[]>());

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
                new DivisionTemplateDto()
            }
        };
        var division = new DivisionDataDto { Id = Guid.NewGuid() };
        var context = new TemplateMatchContext(_season, new[] { division }, new Dictionary<Guid, TeamDto[]>());

        var result = context.GetDivisionMappings(template).ToArray();

        Assert.That(result.Length, Is.EqualTo(1));
        Assert.That(result[0].SeasonDivision, Is.SameAs(division));
        Assert.That(result[0].TemplateDivision, Is.SameAs(template.Divisions[0]));
    }

    [Test]
    public void SharedAddressesFromSeason_GivenNoTeams_ReturnsEmpty()
    {
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(seasonDivision, templateDivision, Array.Empty<TeamDto>());

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void SharedAddressesFromSeason_GivenUniqueAddressesForEachTeam_ReturnsEmpty()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "C" };
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(seasonDivision, templateDivision, new[] { team1, team2, team3 });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void SharedAddressesFromSeason_GivenSomeSharedAddresses_ReturnsTeamsWithSharedAddress()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "A" };
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(seasonDivision, templateDivision, new[] { team1, team2, team3 });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.EquivalentTo(new[] { new[] { team1, team3 } }));
    }

    [Test]
    public void SharedAddressesFromSeason_GivenSomeSharedAddressesIncludingWhitespace_ReturnsTeamsWithSharedAddress()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "A " };
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(seasonDivision, templateDivision, new[] { team1, team2, team3 });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.EquivalentTo(new[] { new[] { team1, team3 } }));
    }

    [Test]
    public void SharedAddressesFromSeason_GivenSomeSharedAddressesDifferentCase_ReturnsTeamsWithSharedAddress()
    {
        var team1 = new TeamDto { Address = "A" };
        var team2 = new TeamDto { Address = "B" };
        var team3 = new TeamDto { Address = "a" };
        var seasonDivision = new DivisionDataDto();
        var templateDivision = new DivisionTemplateDto();
        var mapping = new TemplateMatchContext.DivisionSharedAddressMapping(seasonDivision, templateDivision, new[] { team1, team2, team3 });

        var result = mapping.SharedAddressesFromSeason;

        Assert.That(result, Is.EquivalentTo(new[] { new[] { team1, team3 } }));
    }
}
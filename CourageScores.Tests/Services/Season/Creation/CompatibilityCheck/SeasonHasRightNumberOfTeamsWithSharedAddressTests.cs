using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class SeasonHasRightNumberOfTeamsWithSharedAddressTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonDto _season = new SeasonDto();
    private readonly SeasonHasRightNumberOfTeamsWithSharedAddress _check = new SeasonHasRightNumberOfTeamsWithSharedAddress();

    [Test]
    public async Task Check_GivenNoRequiredSharedAddressesAndNonePresent_ReturnsSuccess()
    {
        var template = new TemplateDto();
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { new TeamDto { Name = "A", Address = "A" } } },
            { division2.Id, new[] { new TeamDto { Name = "B", Address = "B" } } },
        };

        var result = await _check.Check(template, TemplateMatchContext(new[] { division1, division2 }, teams), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenNoSharedAddressAndSomeSupported_ReturnsSuccess()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                new[]
                {
                    new TeamPlaceholderDto("a"),
                    new TeamPlaceholderDto("b")
                }.ToList(),
            }
        };
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { new TeamDto { Name = "A", Address = "A" } } },
            { division2.Id, new[] { new TeamDto { Name = "B", Address = "B" } } },
        };

        var result = await _check.Check(template, TemplateMatchContext(new[] { division1, division2 }, teams), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenMatchingNumberRequiredSharedAddresses_ReturnsSuccess()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                new[]
                {
                    new TeamPlaceholderDto("a"),
                    new TeamPlaceholderDto("b")
                }.ToList(),
            }
        };
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { new TeamDto { Name = "A", Address = "A" } } },
            { division2.Id, new[] { new TeamDto { Name = "B", Address = "A" } } },
        };

        var result = await _check.Check(template, TemplateMatchContext(new[] { division1, division2 }, teams), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenSeasonHasMoreSharedAddressesThenSupported_ReturnsFailure()
    {
        var template = new TemplateDto
        {
            SharedAddresses =
            {
                new[]
                {
                    new TeamPlaceholderDto("a"),
                    new TeamPlaceholderDto("b")
                }.ToList(),
            }
        };
        var division1 = new DivisionDataDto { Id = Guid.NewGuid() };
        var division2 = new DivisionDataDto { Id = Guid.NewGuid() };
        var teams = new Dictionary<Guid, TeamDto[]>
        {
            { division1.Id, new[] { new TeamDto { Name = "A", Address = "A" }, new TeamDto { Name = "C", Address = "C" } } },
            { division2.Id, new[] { new TeamDto { Name = "B", Address = "A" }, new TeamDto { Name = "D", Address = "C" } } },
        };

        var result = await _check.Check(template, TemplateMatchContext(new[] { division1, division2 }, teams), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Template supports up-to 1 cross-division shared addresses, found 2" }));
    }

    private TemplateMatchContext TemplateMatchContext(IEnumerable<DivisionDataDto> divisions, Dictionary<Guid, TeamDto[]> teams)
    {
        return new TemplateMatchContext(
            _season,
            divisions,
            teams);
    }
}
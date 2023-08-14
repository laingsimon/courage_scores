using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class SameNumberOfDivisionsTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonDto _season = new SeasonDto();
    private readonly SameNumberOfDivisions _check = new SameNumberOfDivisions();

    [Test]
    public async Task Check_GivenMatchingNumberOfDivisions_ReturnsTemplateCompatible()
    {
        var template = new TemplateDto
        {
            Name = "2 division template",
            Divisions =
            {
                new DivisionTemplateDto(),
                new DivisionTemplateDto(),
            }
        };
        var division1 = new DivisionDataDto();
        var division2 = new DivisionDataDto();

        var result = await _check.Check(template, TemplateMatchContext(new[] { division1, division2 }), _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenIncorrectNumberOfDivisions_ReturnsTemplateIncompatible()
    {
        var template = new TemplateDto
        {
            Name = "2 division template",
            Divisions =
            {
                new DivisionTemplateDto(),
                new DivisionTemplateDto(),
            }
        };
        var division = new DivisionDataDto();

        var result = await _check.Check(template, TemplateMatchContext(new[] { division }), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Template has 2 divisions, season has 1" }));
    }

    private TemplateMatchContext TemplateMatchContext(IEnumerable<DivisionDataDto> divisions)
    {
        return new TemplateMatchContext(_season, divisions.ToArray(), new Dictionary<Guid, TeamDto[]>());
    }
}
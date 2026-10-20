using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation.CompatibilityCheck;

[TestFixture]
public class ApplicableNumberOfTeamsInEachDivisionCheckTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly ApplicableNumberOfTeamsInEachDivisionCheck _check = new();
    private readonly SeasonDto _season = new SeasonDto();

    [Test]
    public async Task Check_GivenNoDivisions_ReturnsSuccess()
    {
        var template = new TemplateDto();
        var context = new TemplateMatchContext(
            _season,
            [],
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = await _check.Check(template, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [TestCase(9, 8, false)]
    [TestCase(8, 8, true)]
    [TestCase(7, 8, true)]
    [TestCase(6, 8, false)]
    [TestCase(8, 7, false)]
    [TestCase(7, 7, false)]
    [TestCase(6, 7, false)]
    public async Task Check_GivenOneDivision_ReturnsCorrectly(int divisionTeamCount, int templatePlaceholderCount, bool success)
    {
        var templateDivision = TemplateDivisionWithTeams(templatePlaceholderCount);
        var division = SeasonDivisionWithTeams(divisionTeamCount);
        var template = new TemplateDto { Divisions = { templateDivision } };
        var context = new TemplateMatchContext(
            _season,
            [division],
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = await _check.Check(template, context, _token);

        Assert.That(result.Success, Is.EqualTo(success));
    }

    [TestCase(1, 0)]
    [TestCase(0, 1)]
    [TestCase(2, 1)]
    [TestCase(1, 2)]
    public async Task Check_GivenDifferingNumberOfDivisions_ReturnsUnsuccessful(int seasonDivisionCount, int templateDivisionCount)
    {
        var template = new TemplateDto { Divisions = Enumerable.Range(0, templateDivisionCount).Select(_ => TemplateDivisionWithTeams(1)).ToList() };
        var context = new TemplateMatchContext(
            _season,
            Enumerable.Range(0, seasonDivisionCount).Select(_ => SeasonDivisionWithTeams(1)).ToArray(),
            new Dictionary<Guid, TeamDto[]>(),
            new Dictionary<string, Guid>());

        var result = await _check.Check(template, context, _token);

        Assert.That(result.Success, Is.False);
    }

    private static DivisionTemplateDto TemplateDivisionWithTeams(int templatePlaceholderCount)
    {
        var fixtures = (int)Math.Floor(templatePlaceholderCount / 2.0d) + (templatePlaceholderCount % 2);

        return new DivisionTemplateDto
        {
            Dates =
            {
                new DateTemplateDto
                {
                    Fixtures = Enumerable.Range(1, fixtures)
                        .Select(i => new FixtureTemplateDto
                        {
                            Home = new TeamPlaceholderDto($"H{i}"),
                            Away = (i * 2) <= templatePlaceholderCount ? new TeamPlaceholderDto($"A{i}") : null,
                        })
                        .ToList(),
                }
            }
        };
    }

    private static DivisionDataDto SeasonDivisionWithTeams(int divisionTeamCount)
    {
        return new DivisionDataDto("CourageScores")
        {
            Teams = Enumerable.Range(0, divisionTeamCount)
                .Select(i => new DivisionTeamDto { Name = $"T{i}" })
                .ToList(),
        };
    }
}

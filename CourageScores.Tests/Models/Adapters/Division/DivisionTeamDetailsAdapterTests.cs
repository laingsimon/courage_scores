using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionTeamDetailsAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DivisionTeamDetailsAdapter _adapter = new DivisionTeamDetailsAdapter();

    [Test]
    public async Task Adapt_GivenTeam_SetsPropertiesCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var divisionId = Guid.NewGuid();
        var model = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
#pragma warning disable CS0618
            DivisionId = divisionId,
#pragma warning restore CS0618
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = divisionId,
                }
            }
        };

        var result = await _adapter.Adapt(model, season, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.DivisionId, Is.EqualTo(divisionId));
    }

    [Test]
    [Obsolete]
    public async Task Adapt_GivenTeamWithMissingSeason_SetsPropertiesCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var divisionId = Guid.NewGuid();
        var model = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
#pragma warning disable CS0618
            DivisionId = divisionId,
#pragma warning restore CS0618
        };

        var result = await _adapter.Adapt(model, season, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.DivisionId, Is.EqualTo(divisionId));
    }
}
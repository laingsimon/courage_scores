using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionTeamAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DivisionTeamAdapter _adapter = new DivisionTeamAdapter();

    [Test]
    public async Task Adapt_GivenTeamAndScore_SetsPropertiesCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
            Address = "address",
        };
        var score = new DivisionData.Score
        {
            TeamPlayed = 1,
            Win = 2,
            Lost = 3,
            Draw = 4,
        };

        var result = await _adapter.Adapt(team, score, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Name, Is.EqualTo(team.Name));
        Assert.That(result.Played, Is.EqualTo(1));
        Assert.That(result.Points, Is.EqualTo(10d).Within(0.001));
        Assert.That(result.Won, Is.EqualTo(2));
        Assert.That(result.Lost, Is.EqualTo(3));
        Assert.That(result.Drawn, Is.EqualTo(4));
        Assert.That(result.Difference, Is.EqualTo(0));
        Assert.That(result.Address, Is.EqualTo(team.Address));
    }

    [Test]
    public async Task WithoutFixtures_GivenTeam_SetsPropertiesCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
            Address = "address",
        };

        var result = await _adapter.WithoutFixtures(team, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Name, Is.EqualTo(team.Name));
        Assert.That(result.Address, Is.EqualTo(team.Address));
        Assert.That(result.Played, Is.EqualTo(0));
        Assert.That(result.Points, Is.EqualTo(0));
    }
}
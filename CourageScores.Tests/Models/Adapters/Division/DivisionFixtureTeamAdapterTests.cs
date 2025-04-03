using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureTeamAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly DivisionFixtureTeamAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenGameTeamAndNoAddress_SetsPropertiesCorrectly()
    {
        var gameTeam = new GameTeam
        {
            Id = Guid.NewGuid(),
            Name = "team",
        };

        var result = await _adapter.Adapt(gameTeam, null, _token);

        Assert.That(result.Id, Is.EqualTo(gameTeam.Id));
        Assert.That(result.Name, Is.EqualTo(gameTeam.Name));
        Assert.That(result.Address, Is.EqualTo(gameTeam.Name));
    }

    [Test]
    public async Task Adapt_GivenGameTeamAndAddress_SetsPropertiesCorrectly()
    {
        var gameTeam = new GameTeam
        {
            Id = Guid.NewGuid(),
            Name = "team",
        };

        var result = await _adapter.Adapt(gameTeam, "address", _token);

        Assert.That(result.Id, Is.EqualTo(gameTeam.Id));
        Assert.That(result.Name, Is.EqualTo(gameTeam.Name));
        Assert.That(result.Address, Is.EqualTo("address"));
    }

    [Test]
    public async Task Adapt_GivenTeamAndAddress_SetsPropertiesCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
            Address = "address",
        };

        var result = await _adapter.Adapt(team, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Name, Is.EqualTo(team.Name));
        Assert.That(result.Address, Is.EqualTo(team.Address));
    }
}
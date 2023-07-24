using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class LeagueFixtureHealthDtoAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly LeagueFixtureHealthDtoAdapter _adapter = new LeagueFixtureHealthDtoAdapter();

    [Test]
    public async Task Adapt_GivenDivisionFixture_SetsPropertiesCorrectly()
    {
        var fixture = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
            HomeTeam = new DivisionFixtureTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
            AwayTeam = new DivisionFixtureTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "AWAY",
            },
        };

        var result = await _adapter.Adapt(fixture, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(fixture.Id));
        Assert.That(result.Date, Is.EqualTo(fixture.Date));
        Assert.That(result.HomeTeamId, Is.EqualTo(fixture.HomeTeam.Id));
        Assert.That(result.HomeTeam, Is.EqualTo(fixture.HomeTeam.Name));
        Assert.That(result.AwayTeamId, Is.EqualTo(fixture.AwayTeam.Id));
        Assert.That(result.AwayTeam, Is.EqualTo(fixture.AwayTeam.Name));
    }

    [Test]
    public async Task Adapt_GivenKnockoutFixture_ReturnsNull()
    {
        var fixture = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
            AwayTeam = new DivisionFixtureTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "AWAY",
            },
            IsKnockout = true,
        };

        var result = await _adapter.Adapt(fixture, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenTentativeFixture_Throws()
    {
        var fixture = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
        };

        var result = await _adapter.Adapt(fixture, _token);

        Assert.That(result, Is.Null);
    }
}
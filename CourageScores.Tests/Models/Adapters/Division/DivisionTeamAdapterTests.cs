using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos.Division;
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
        var score = new DivisionData.TeamScore
        {
            FixturesPlayed = 1,
            FixturesWon = 2,
            FixturesLost = 3,
            FixturesDrawn = 4,
        };
        var teamPlayers = new[]
        {
            new DivisionPlayerDto
            {
                Singles = { WinRate = 1, TeamWinRate = 10, TeamLossRate = 11, MatchesWon = 21, MatchesLost = 31 },
                Pairs = { WinRate = 2, TeamWinRate = 20, TeamLossRate = 12, MatchesWon = 22, MatchesLost = 32 },
                Triples = { WinRate = 3, TeamWinRate = 30, TeamLossRate = 13, MatchesWon = 23, MatchesLost = 33 },
            }
        };

        var result = await _adapter.Adapt(team, score, teamPlayers, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Name, Is.EqualTo(team.Name));
        Assert.That(result.Played, Is.EqualTo(1));
        Assert.That(result.Points, Is.EqualTo(8d).Within(0.001));
        Assert.That(result.FixturesWon, Is.EqualTo(2));
        Assert.That(result.FixturesLost, Is.EqualTo(3));
        Assert.That(result.FixturesDrawn, Is.EqualTo(4));
        Assert.That(result.Address, Is.EqualTo(team.Address));
        Assert.That(result.MatchesWon, Is.EqualTo(21+22+23));
        Assert.That(result.MatchesLost, Is.EqualTo(31+32+33));
        Assert.That(result.WinRate, Is.EqualTo(10+20+30));
        Assert.That(result.LossRate, Is.EqualTo(11+12+13));
        Assert.That(result.Difference, Is.EqualTo((10+20+30) - (11+12+13)));
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
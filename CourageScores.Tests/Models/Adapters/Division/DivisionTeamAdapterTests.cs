using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionTeamAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly DivisionTeamAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenTeamAndScore_SetsPropertiesCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
            Address = "address",
            Updated = new DateTime(2023, 01, 02),
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
                Singles =
                {
                    WinRate = 1,
                    TeamWinRate = 10,
                    TeamLossRate = 11,
                    MatchesWon = 21,
                    MatchesLost = 31,
                },
                Pairs =
                {
                    WinRate = 2,
                    TeamWinRate = 20,
                    TeamLossRate = 12,
                    MatchesWon = 22,
                    MatchesLost = 32,
                },
                Triples =
                {
                    WinRate = 3,
                    TeamWinRate = 30,
                    TeamLossRate = 13,
                    MatchesWon = 23,
                    MatchesLost = 33,
                },
            },
        };
        var division = new DivisionDto
        {
            Name = "division",
        };

        var result = await _adapter.Adapt(team, score, teamPlayers, division, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Name, Is.EqualTo(team.Name));
        Assert.That(result.Division, Is.EqualTo(division));
        Assert.That(result.Played, Is.EqualTo(1));
        Assert.That(result.Points, Is.EqualTo(8d).Within(0.001));
        Assert.That(result.FixturesWon, Is.EqualTo(2));
        Assert.That(result.FixturesLost, Is.EqualTo(3));
        Assert.That(result.FixturesDrawn, Is.EqualTo(4));
        Assert.That(result.Address, Is.EqualTo(team.Address));
        Assert.That(result.MatchesWon, Is.EqualTo(21 + 22 + 23));
        Assert.That(result.MatchesLost, Is.EqualTo(31 + 32 + 33));
        Assert.That(result.WinRate, Is.EqualTo(10 + 20 + 30));
        Assert.That(result.LossRate, Is.EqualTo(11 + 12 + 13));
        Assert.That(result.Difference, Is.EqualTo(10 + 20 + 30 - (11 + 12 + 13)));
        Assert.That(result.Updated, Is.EqualTo(team.Updated));
    }

    [Test]
    public async Task Adapt_GivenNoDivision_SetsDivisionToNull()
    {
        var team = new TeamDto();
        var score = new DivisionData.TeamScore();
        var teamPlayers = Array.Empty<DivisionPlayerDto>();

        var result = await _adapter.Adapt(team, score, teamPlayers, null, _token);

        Assert.That(result.Division, Is.Null);
    }

    [Test]
    public async Task WithoutFixtures_GivenTeam_SetsPropertiesCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
            Address = "address",
            Updated = new DateTime(2023, 01, 02),
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division",
        };

        var result = await _adapter.WithoutFixtures(team, division, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Name, Is.EqualTo(team.Name));
        Assert.That(result.Address, Is.EqualTo(team.Address));
        Assert.That(result.Played, Is.EqualTo(0));
        Assert.That(result.Points, Is.EqualTo(0));
        Assert.That(result.Updated, Is.EqualTo(team.Updated));
        Assert.That(result.Division, Is.EqualTo(division));
    }

    [Test]
    public async Task WithoutFixtures_GivenNoDivision_SetsDivisionToNull()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
        };

        var result = await _adapter.WithoutFixtures(team, null, _token);

        Assert.That(result.Division, Is.Null);
    }
}
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionPlayerAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DivisionPlayerAdapter _adapter = new DivisionPlayerAdapter();

    [Test]
    public async Task Adapt_GivenNoFixtures_SetsPropertiesCorrectly()
    {
        var score = new DivisionData.PlayerScore
        {
            OneEighty = 3,
            HiCheckout = 4,
            PlayerPlayCount =
            {
                { 1, new DivisionData.PlayerPlayScore { Lost = 1, Win = 2, Played = 7, Draw = 5, WinDifference = 1 } }, // singles
                { 2, new DivisionData.PlayerPlayScore { Lost = 11, Win = 22, Played = 8, Draw = 55, WinDifference = 2 } }, // pairs
                { 3, new DivisionData.PlayerPlayScore { Lost = 111, Win = 222, Played = 9, Draw = 555, WinDifference = 3 } }, // triples
            }
        };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "address",
            Name = "team",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "player",
            Captain = true,
        };
        var playerTuple = new DivisionData.TeamPlayerTuple(player, team);
        var fixtures = new Dictionary<DateTime, Guid>();

        var result = await _adapter.Adapt(score, playerTuple, fixtures, _token);

        Assert.That(result.Id, Is.EqualTo(player.Id));
        Assert.That(result.Captain, Is.EqualTo(player.Captain));
        Assert.That(result.Name, Is.EqualTo(player.Name));
        Assert.That(result.LostSingles, Is.EqualTo(score.GetScores(1).Lost));
        Assert.That(result.WonSingles, Is.EqualTo(score.GetScores(1).Win));
        Assert.That(result.OneEighties, Is.EqualTo(score.OneEighty));
        Assert.That(result.Over100Checkouts, Is.EqualTo(score.HiCheckout));
        Assert.That(result.PlayedSingles, Is.EqualTo(7));
        Assert.That(result.PlayedPairs, Is.EqualTo(8));
        Assert.That(result.PlayedTriples, Is.EqualTo(9));
        Assert.That(result.Points, Is.EqualTo(11));
        Assert.That(result.WinPercentage, Is.EqualTo(28.57d).Within(0.001));
        Assert.That(result.TeamId, Is.EqualTo(team.Id));
        Assert.That(result.Team, Is.EqualTo(team.Name));
        Assert.That(result.Fixtures, Is.EqualTo(fixtures));
        Assert.That(result.WinDifference, Is.EqualTo(6));
    }
}
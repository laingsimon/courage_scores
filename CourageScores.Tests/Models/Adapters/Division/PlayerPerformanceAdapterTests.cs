using CourageScores.Models.Adapters.Division;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class PlayerPerformanceAdapterTests
{
    private readonly PlayerPerformanceAdapter _adapter = new();
    private readonly CancellationToken _token = new();

    [Test]
    public async Task Adapt_GivenScore_SetsPropertiesCorrectly()
    {
        var score = new DivisionData.PlayerPlayScore
        {
            MatchesPlayed = 1,
            MatchesWon = 2,
            MatchesLost = 3,
            PlayerWinRate = 5,
            PlayerLossRate = 6,
            TeamWinRate = 7,
            TeamLossRate = 8,
        };

        var result = await _adapter.Adapt(score, _token);

        Assert.That(result.MatchesPlayed, Is.EqualTo(score.MatchesPlayed));
        Assert.That(result.MatchesWon, Is.EqualTo(score.MatchesWon));
        Assert.That(result.MatchesLost, Is.EqualTo(score.MatchesLost));
        Assert.That(result.WinRate, Is.EqualTo(score.PlayerWinRate));
        Assert.That(result.LossRate, Is.EqualTo(score.PlayerLossRate));
        Assert.That(result.TeamWinRate, Is.EqualTo(score.TeamWinRate));
        Assert.That(result.TeamLossRate, Is.EqualTo(score.TeamLossRate));
    }
}
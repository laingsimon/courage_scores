using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Analysis;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Analysis;

[TestFixture]
public class HighestScoresVisitorTests
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Test]
    public async Task VisitThrow_GivenDifferentTeams_ReturnsCorrectResults()
    {
        var visitor = new HighestScoresVisitor();
        var response = new AnalysisResponseDto();

        await visitor.VisitThrow(Player("HOME"), 0, Throw(5), _token);
        await visitor.VisitThrow(Player("HOME"), 0, Throw(5), _token);
        await visitor.VisitThrow(Player("HOME"), 0, Throw(10), _token);
        visitor.Finished(response);

        Assert.That(response["HighestScores"].Keys, Is.EquivalentTo(["HOME"]));
        Assert.That(response["HighestScores"]["HOME"], Is.EqualTo([
            new ScoreBreakdownDto(10, 1),
            new ScoreBreakdownDto(5, 2),
        ]));
    }

    private static SaygTeamPlayer Player(string team)
    {
        return new SaygTeamPlayer(team, null, "player");
    }

    private static LegThrowDto Throw(int score)
    {
        return new LegThrowDto
        {
            Score = score
        };
    }
}
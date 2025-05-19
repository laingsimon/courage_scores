using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Analysis;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Analysis;

[TestFixture]
public class MostFrequentPlayerVisitorTests
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Test]
    public async Task VisitThrow_GivenDifferentTeamPlayers_ReturnsCorrectResults()
    {
        var visitor = new MostFrequentPlayerVisitor();
        var response = new AnalysisResponseDto();

        await visitor.VisitMatch(new RecordedScoreAsYouGoDto(), new SaygMatchVisitorContext(Player("HOME", "John"), Player("AWAY", "Steve")), _token);
        await visitor.VisitMatch(new RecordedScoreAsYouGoDto(), new SaygMatchVisitorContext(Player("HOME", "John"), Player("AWAY", "Steve")), _token);
        await visitor.VisitMatch(new RecordedScoreAsYouGoDto(), new SaygMatchVisitorContext(Player("HOME", "Paul"), Player("AWAY", "Steve")), _token);
        visitor.Finished(response);

        Assert.That(response.MostFrequentPlayers.Keys, Is.EquivalentTo(["HOME", "AWAY"]));
        Assert.That(response.MostFrequentPlayers["HOME"], Is.EqualTo([
            new KeyValuePair<string,int>("John", 2),
            new KeyValuePair<string,int>("Paul", 1),
        ]));
        Assert.That(response.MostFrequentPlayers["AWAY"], Is.EqualTo([
            new KeyValuePair<string,int>("Steve", 3),
        ]));
    }

    private static SaygTeamPlayer Player(string team, string player)
    {
        return new SaygTeamPlayer(team, null, player);
    }
}
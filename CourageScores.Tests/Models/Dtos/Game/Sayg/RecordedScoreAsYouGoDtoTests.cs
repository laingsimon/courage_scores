using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Analysis;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Game.Sayg;

[TestFixture]
public class RecordedScoreAsYouGoDtoTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<ISaygVisitor> _visitor = null!;
    private SaygMatchVisitorContext _match = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _visitor = new Mock<ISaygVisitor>();
        _match = new SaygMatchVisitorContext(
            TeamPlayer("HOME", "Joe"),
            TeamPlayer("AWAY", "Smith"));
    }

    [Test]
    public async Task Accept_ShouldVisitMatch()
    {
        var sayg = new RecordedScoreAsYouGoDto();

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitMatch(sayg, _match, _token));
    }

    [Test]
    public async Task Accept_ShouldVisitMatchOptions()
    {
        var sayg = new RecordedScoreAsYouGoDto
        {
            StartingScore = 501,
            NumberOfLegs = 5,
        };

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitMatchOptions(501, 5, _token));
    }

    [Test]
    public async Task? Accept_ShouldVisitEachLeg()
    {
        var leg1 = Leg(Throws(), Throws());
        var leg2 = Leg(Throws(), Throws());
        var sayg = new RecordedScoreAsYouGoDto
        {
            Legs =
            {
                { 0, leg1 },
                { 1, leg2 },
            },
        };

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitLeg(0, leg1, _token));
        _visitor.Verify(v => v.VisitLeg(1, leg2, _token));
    }

    [Test]
    public async Task Accept_WhenVisitingLastLeg_ShouldVisitDeciderLeg()
    {
        var leg1 = Leg(Throws(), Throws());
        var leg2 = Leg(Throws(), Throws());
        var leg3 = Leg(Throws(), Throws());
        var sayg = new RecordedScoreAsYouGoDto
        {
            NumberOfLegs = 3,
            Legs =
            {
                { 0, leg1 },
                { 1, leg2 },
                { 2, leg3 },
            },
        };

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitDeciderLeg(leg3, _token));
    }

    [Test]
    public async Task Accept_GivenHomeWinner_ShouldVisitHomeWinnerAndAwayLoser()
    {
        var leg1 = Leg(
            Throws(180, 180, 141),
            Throws(50, 50, 50));
        var sayg = new RecordedScoreAsYouGoDto
        {
            YourName = "HOME",
            OpponentName = "AWAY",
            Legs =
            {
                { 0, leg1 },
            },
        };

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitWinner(It.Is<SaygTeamPlayer>(p => p.TeamName == "HOME"), 351, _token));
        _visitor.Verify(v => v.VisitLoser(It.Is<SaygTeamPlayer>(p => p.TeamName == "AWAY"), 351, _token));
    }

    [Test]
    public async Task Accept_GivenAwayWinner_ShouldVisitAwayWinnerAndHomeLoser()
    {
        var leg1 = Leg(
            Throws(50, 50, 50),
            Throws(180, 180, 141));
        var sayg = new RecordedScoreAsYouGoDto
        {
            YourName = "HOME",
            OpponentName = "AWAY",
            Legs =
            {
                { 0, leg1 },
            },
        };

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitWinner(It.Is<SaygTeamPlayer>(p => p.TeamName == "AWAY"), 351, _token));
        _visitor.Verify(v => v.VisitLoser(It.Is<SaygTeamPlayer>(p => p.TeamName == "HOME"), 351, _token));
    }

    [Test]
    public async Task Accept_GivenNoWinner_ShouldNotVisitWinnerOrLoser()
    {
        var leg1 = Leg(
            Throws(50, 50, 50),
            Throws(50, 50, 50));
        var sayg = new RecordedScoreAsYouGoDto
        {
            YourName = "HOME",
            OpponentName = "AWAY",
            Legs =
            {
                { 0, leg1 },
            },
        };

        await sayg.Accept(_visitor.Object, _match, _token);

        _visitor.Verify(v => v.VisitWinner(It.IsAny<SaygTeamPlayer>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never());
        _visitor.Verify(v => v.VisitLoser(It.IsAny<SaygTeamPlayer>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never());
    }

    private static LegDto Leg(LegCompetitorScoreDto home, LegCompetitorScoreDto away)
    {
        return new LegDto
        {
            StartingScore = 501,
            PlayerSequence =
            {
                new LegPlayerSequenceDto { Value = "Home" },
                new LegPlayerSequenceDto { Value = "Away" },
            },
            Home = home,
            Away = away,
        };
    }

    private static LegCompetitorScoreDto Throws(params int[] throws)
    {
        return new LegCompetitorScoreDto
        {
            Throws = throws.Select(thr => new LegThrowDto { NoOfDarts = 3, Score = thr }).ToList(),
        };
    }

    private static SaygTeamPlayer TeamPlayer(string teamName, string playerName)
    {
        return new SaygTeamPlayer(teamName, null, playerName);
    }
}

using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Analysis;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Game.Sayg;

[TestFixture]
public class LegDtoTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private SaygMatchVisitorContext _context = null!;
    private SaygTeamPlayer _homePlayer = null!;
    private SaygTeamPlayer _awayPlayer = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _homePlayer = new SaygTeamPlayer("HOME", null, "");
        _awayPlayer = new SaygTeamPlayer("AWAY", null, "");

        _context = new SaygMatchVisitorContext(
            _homePlayer,
            _awayPlayer);
    }

    [Test]
    public async Task Accept_GivenHomePlayingFirst_VisitsPlayerThrowsInSequence()
    {
        var leg = Leg(
            "Home",
            "Away",
            Throws(1, 3, 5),
            Throws(2, 4, 6));
        var throws = new List<string>();
        var visitor = new Mock<ISaygVisitor>();
        visitor
            .Setup(v => v.VisitThrow(It.IsAny<SaygTeamPlayer>(), It.IsAny<int>(), It.IsAny<LegThrowDto>()))
            .Callback((SaygTeamPlayer player, int _, LegThrowDto thr) =>
            {
                throws.Add($"{player.TeamName}:{thr.Score}");
            });

        await leg.Accept(0, _context, visitor.Object, _token);

        Assert.That(
            throws,
            Is.EqualTo(new[]
            {
                "HOME:1",
                "AWAY:2",
                "HOME:3",
                "AWAY:4",
                "HOME:5",
                "AWAY:6",
            }));
    }

    [Test]
    public async Task Accept_GivenAwayPlayingFirst_VisitsPlayerThrowsInSequence()
    {
        var leg = Leg(
            "Away",
            "Home",
            Throws(1, 3, 5),
            Throws(2, 4, 6));
        var throws = new List<string>();
        var visitor = new Mock<ISaygVisitor>();
        visitor
            .Setup(v => v.VisitThrow(It.IsAny<SaygTeamPlayer>(), It.IsAny<int>(), It.IsAny<LegThrowDto>()))
            .Callback((SaygTeamPlayer player, int _, LegThrowDto thr) =>
            {
                throws.Add($"{player.TeamName}:{thr.Score}");
            });

        await leg.Accept(0, _context, visitor.Object, _token);

        Assert.That(
            throws,
            Is.EqualTo(new[]
            {
                "AWAY:2",
                "HOME:1",
                "AWAY:4",
                "HOME:3",
                "AWAY:6",
                "HOME:5",
            }));
    }

    [Test]
    public async Task Accept_GivenHomeCheckout_VisitsHomeCheckout()
    {
        var leg = Leg(
            "Home",
            "Away",
            Throws(180 /* =321*/, 180 /* 141*/, 141),
            Throws(10, 11, 12));
        var visitor = new Mock<ISaygVisitor>();

        var winner = await leg.Accept(0, _context, visitor.Object, _token);

        visitor.Verify(v => v.VisitCheckout(_homePlayer, 2, leg.Home.Throws.Last()));
        Assert.That(winner, Is.EqualTo(CompetitorType.Home));
    }

    [Test]
    public async Task Accept_GivenNoCheckout_ReturnsNull()
    {
        var leg = Leg(
            "Home",
            "Away",
            Throws(20, 30, 40),
            Throws(10, 11, 12));
        var visitor = new Mock<ISaygVisitor>();

        var winner = await leg.Accept(0, _context, visitor.Object, _token);

        Assert.That(winner, Is.Null);
    }

    [TestCase(1)]
    [TestCase(10)]
    public async Task Accept_GivenHomeBust_VisitsHomeBust(int score)
    {
        var leg = Leg(
            "Home",
            "Away",
            Throws(180 /* =321*/, 180 /* 141*/, 139 /*2*/, score),
            Throws(10, 11, 12, 13, 14));
        var visitor = new Mock<ISaygVisitor>();

        await leg.Accept(0, _context, visitor.Object, _token);

        visitor.Verify(v => v.VisitBust(_homePlayer, 3, leg.Home.Throws.Last()));
    }

    private static LegDto Leg(string first, string second, LegCompetitorScoreDto home, LegCompetitorScoreDto away)
    {
        return new LegDto
        {
            StartingScore = 501,
            PlayerSequence =
            {
                new LegPlayerSequenceDto {Value = first, Text = first},
                new LegPlayerSequenceDto {Value = second, Text = second},
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
}

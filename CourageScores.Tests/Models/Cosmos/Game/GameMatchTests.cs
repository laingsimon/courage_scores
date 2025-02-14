using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class GameMatchTests
{
    private GameMatch _match = null!;
    private CosmosGame _game = null!;
    private GameMatchOption _matchOptions = null!;
    private IVisitorScope _visitorScope = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _match = new GameMatch();
        _matchOptions = new GameMatchOption
        {
            NumberOfLegs = 5,
        };
        _game = new CosmosGame
        {
            MatchOptions =
            {
                _matchOptions
            }
        };
        _visitorScope = new VisitorScope
        {
            Index = 0,
            Game = _game,
        };
    }

    [Test]
    public void Accept_GivenMatch_VisitsMatch()
    {
        var visitor = new Mock<IGameVisitor>();

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatch(_visitorScope, _match));
    }

    [Test]
    public void Accept_GivenEqualPlayerCounts_VisitsHomeAndAwayPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitPlayer(_visitorScope, homePlayer, 1));
        visitor.Verify(v => v.VisitPlayer(_visitorScope, awayPlayer, 1));
    }

    [Test]
    public void Accept_GivenUnequalPlayerCounts_DoesNotVisitPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitPlayer(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>(), It.IsAny<int>()), Times.Never);
    }

    [TestCase(3, 1, 5)]
    [TestCase(4, 3, 7)]
    [TestCase(4, 4, 7)] // this is specific to home, as it should prevent checking whether away won
    [TestCase(3, 1, null)]
    public void Accept_GivenEqualPlayerCountsAndHomeWinner_VisitsMatchHomeWinAndAwayLoss(int home, int away, int? numberOfLegs)
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = home;
        _match.AwayScore = away;
        _matchOptions.NumberOfLegs = numberOfLegs;

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(_visitorScope, _match.HomePlayers, TeamDesignation.Home, home, away), Times.Once);
        visitor.Verify(v => v.VisitMatchLost(_visitorScope, _match.AwayPlayers, TeamDesignation.Away, away, home), Times.Once);
    }

    [TestCase(1, 3, 5)]
    [TestCase(3, 4, 7)]
    [TestCase(1, 3, null)]
    public void Accept_GivenEqualPlayerCountsAndAwayWinner_VisitsMatchHomeLossAndAwayWin(int home, int away, int? numberOfLegs)
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = home;
        _match.AwayScore = away;
        _matchOptions.NumberOfLegs = numberOfLegs;

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchLost(_visitorScope, _match.HomePlayers, TeamDesignation.Home, home, away), Times.Once);
        visitor.Verify(v => v.VisitMatchWin(_visitorScope, _match.AwayPlayers, TeamDesignation.Away, away, home), Times.Once);
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndDraw_VisitsDataError()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer { Name = "HOME" };
        var awayPlayer = new GamePlayer { Name = "AWAY" };
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = 1;
        _match.AwayScore = 1;

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitDataError(_visitorScope, "Match between HOME and AWAY is a 1-1 draw, scores won't count on players table"));
    }

    [Test]
    public void Accept_GivenObscureScoresAndEqualPlayerCountsAndDraw_VisitsDataError()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer { Name = "HOME" };
        var awayPlayer = new GamePlayer { Name = "AWAY" };
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = 1;
        _match.AwayScore = 1;

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitDataError(_visitorScope, "Match between HOME and AWAY is a 1-1 draw, scores won't count on players table"));
    }

    [Test]
    public void Accept_GivenUnequalPlayerCountsAndHomeWinner_DoesNotVisitWinnerOrLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.HomeScore = 1;
        _match.AwayScore = 0;

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndNoScores_DoesNotVisitWinnerOrLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(_visitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }
}
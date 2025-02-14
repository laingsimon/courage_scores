using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class GameMatchTests
{
    private GameMatch _match = null!;
    private static readonly IVisitorScope VisitorScope = new VisitorScope();

    [SetUp]
    public void SetupEachTest()
    {
        _match = new GameMatch();
    }

    [Test]
    public void Accept_GivenMatch_VisitsMatch()
    {
        var visitor = new Mock<IGameVisitor>();

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatch(VisitorScope, _match));
    }

    [Test]
    public void Accept_GivenEqualPlayerCounts_VisitsHomeAndAwayPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitPlayer(VisitorScope, homePlayer, 1));
        visitor.Verify(v => v.VisitPlayer(VisitorScope, awayPlayer, 1));
    }

    [Test]
    public void Accept_GivenUnequalPlayerCounts_DoesNotVisitPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitPlayer(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndHomeWinner_VisitsMatchHomeWinAndAwayLoss()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = 3;
        _match.AwayScore = 1;

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(VisitorScope, _match.HomePlayers, TeamDesignation.Home, 3, 1));
        visitor.Verify(v => v.VisitMatchLost(VisitorScope, _match.AwayPlayers, TeamDesignation.Away, 1, 3));
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndAwayWinner_VisitsMatchHomeLossAndAwayWin()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = 1;
        _match.AwayScore = 3;

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchLost(VisitorScope, _match.HomePlayers, TeamDesignation.Home, 1, 3));
        visitor.Verify(v => v.VisitMatchWin(VisitorScope, _match.AwayPlayers, TeamDesignation.Away, 3, 1));
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

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitDataError(VisitorScope, "Match between HOME and AWAY is a 1-1 draw, scores won't count on players table"));
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

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitDataError(VisitorScope, "Match between HOME and AWAY is a 1-1 draw, scores won't count on players table"));
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

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndNoScores_DoesNotVisitWinnerOrLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }
}
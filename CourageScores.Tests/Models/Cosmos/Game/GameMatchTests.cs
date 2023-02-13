using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class GameMatchTests
{
    private GameMatch _match = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _match = new GameMatch();
    }

    [Test]
    public void Accept_GivenMatch_VisitsMatch()
    {
        var visitor = new Mock<IGameVisitor>();

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatch(_match));
    }

    [Test]
    public void Accept_GivenEqualPlayerCounts_VisitsHomeAndAwayPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitPlayer(homePlayer, 1));
        visitor.Verify(v => v.VisitPlayer(awayPlayer, 1));
    }

    [Test]
    public void Accept_GivenUnequalPlayerCounts_DoesNotVisitPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitPlayer(It.IsAny<GamePlayer>(), It.IsAny<int>()), Times.Never);
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

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(_match.HomePlayers, TeamDesignation.Home, 3, 1));
        visitor.Verify(v => v.VisitMatchLost(_match.AwayPlayers, TeamDesignation.Away, 1, 3));
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

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchLost(_match.HomePlayers, TeamDesignation.Home, 1, 3));
        visitor.Verify(v => v.VisitMatchWin(_match.AwayPlayers, TeamDesignation.Away, 3, 1));
    }

    [Test]
    public void Accept_GivenUnequalPlayerCountsAndHomeWinner_DoesNotMatchWinnerOrLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.HomeScore = 1;
        _match.AwayScore = 0;

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndNoScores_DoesNotVisitWinnerOrLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchLost(It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }
}

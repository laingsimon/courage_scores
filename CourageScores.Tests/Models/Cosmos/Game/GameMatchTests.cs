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
        _match.HomeScore = 1;
        _match.AwayScore = 0;

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchWin(_match.HomePlayers, TeamDesignation.Home));
        visitor.Verify(v => v.VisitMatchLost(_match.AwayPlayers, TeamDesignation.Away));
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndAwayWinner_VisitsMatchHomeLossAndAwayWin()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = 0;
        _match.AwayScore = 1;

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchLost(_match.HomePlayers, TeamDesignation.Home));
        visitor.Verify(v => v.VisitMatchWin(_match.AwayPlayers, TeamDesignation.Away));
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndDraw_VisitsMatchDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        var homePlayer = new GamePlayer();
        var awayPlayer = new GamePlayer();
        _match.HomePlayers.Add(homePlayer);
        _match.AwayPlayers.Add(awayPlayer);
        _match.HomeScore = 1;
        _match.AwayScore = 1;

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchDraw(_match.HomePlayers, _match.AwayPlayers, 1));
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

        visitor.Verify(v => v.VisitMatchWin(It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>()), Times.Never);
    }

    [Test]
    public void Accept_GivenUnequalPlayerCountsAndDraw_DoesNotVisitMatchDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());
        _match.HomeScore = 1;
        _match.AwayScore = 1;

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchDraw(It.IsAny<List<GamePlayer>>(), It.IsAny<List<GamePlayer>>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void Accept_GivenEqualPlayerCountsAndNoScores_DoesNotVisitWinnerOrDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        _match.HomePlayers.Add(new GamePlayer());
        _match.AwayPlayers.Add(new GamePlayer());

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatchDraw(It.IsAny<List<GamePlayer>>(), It.IsAny<List<GamePlayer>>(), It.IsAny<int>()), Times.Never);
        visitor.Verify(v => v.VisitMatchWin(It.IsAny<List<GamePlayer>>(), It.IsAny<TeamDesignation>()), Times.Never);
    }

    [Test]
    public void Accept_GivenOneEighties_VisitOneEighties()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new GamePlayer();
        _match.OneEighties.Add(player);

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitOneEighty(player));
    }

    [Test]
    public void Accept_GivenHiChecks_VisitHiChecks()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new NotablePlayer();
        _match.Over100Checkouts.Add(player);

        _match.Accept(visitor.Object);

        visitor.Verify(v => v.VisitHiCheckout(player));
    }
}

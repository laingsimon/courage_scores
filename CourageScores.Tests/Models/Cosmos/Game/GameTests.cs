using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class GameTests
{
    private CosmosGame _game = null!;
    private Mock<IVisitorScope> _visitorScope = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _visitorScope = new Mock<IVisitorScope>();
        _visitorScope.Setup(s => s.With(It.IsAny<IVisitorScope>())).Returns(_visitorScope.Object);
        _game = new CosmosGame
        {
            Home = new GameTeam
            {
                Id = Guid.NewGuid(),
            },
            Away = new GameTeam
            {
                Id = Guid.NewGuid(),
            },
            AwaySubmission = new CosmosGame(),
            HomeSubmission = new CosmosGame(),
        };
    }

    [Test]
    public void Accept_GivenGames_VisitsGame()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGame(_game));
    }

    [Test]
    public void Accept_GivenNoMatches_VisitsTeamsAsPending()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Home, GameState.Pending));
        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Away, GameState.Pending));
    }

    [Test]
    public void Accept_GivenSomeMatchesWithHomeScores_VisitsTeamsAsPlayed()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch { HomeScore = 1 });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Home, GameState.Played));
        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Away, GameState.Played));
    }

    [Test]
    public void Accept_GivenSomeMatchesWithAwayScores_VisitsTeamsAsPlayed()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch { AwayScore = 1 });
        _game.Accept(_visitorScope.Object, visitor.Object);
        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Home, GameState.Played));
        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Away, GameState.Played));
    }

    [Test]
    public void Accept_GivenSomeMatchesWithoutScores_VisitsTeamsAsPending()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch());
        _game.Accept(_visitorScope.Object, visitor.Object);
        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Home, GameState.Pending));
        visitor.Verify(v => v.VisitTeam(_visitorScope.Object, _game.Away, GameState.Pending));
    }

    [Test]
    public void Accept_GivenNoManOfTheMatch_DoesNotVisitManOfMatch()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitManOfTheMatch(It.IsAny<IVisitorScope>(), It.IsAny<Guid>()), Times.Never);
    }

    [Test]
    public void Accept_GivenHomeAndAwayManOfTheMatch_VisitsBothManOfMatch()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Home.ManOfTheMatch = Guid.NewGuid();
        _game.Away.ManOfTheMatch = Guid.NewGuid();

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitManOfTheMatch(_visitorScope.Object, _game.Home.ManOfTheMatch));
        visitor.Verify(v => v.VisitManOfTheMatch(_visitorScope.Object, _game.Away.ManOfTheMatch));
    }

    [Test]
    public void Accept_GivenNoPlayerWinner_DoesNotVisitWinnerOrLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomeScore = 1,
            AwayScore = 2,
        });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGameWinner(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
        visitor.Verify(v => v.VisitGameLoser(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void Accept_GivenAwayWinner_VisitsAwayWinnerAndHomeLoser()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomePlayers = { new GamePlayer() },
            HomeScore = 1,
            AwayPlayers = { new GamePlayer() },
            AwayScore = 2,
        });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGameLoser(_visitorScope.Object, _game.Home));
        visitor.Verify(v => v.VisitGameWinner(_visitorScope.Object, _game.Away));
    }

    [Test]
    public void Accept_GivenHomeWinner_VisitsAwayLoserAndHomeWinner()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomePlayers = { new GamePlayer() },
            HomeScore = 2,
            AwayPlayers = { new GamePlayer() },
            AwayScore = 1,
        });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGameWinner(_visitorScope.Object, _game.Home));
        visitor.Verify(v => v.VisitGameLoser(_visitorScope.Object, _game.Away));
    }

    [Test]
    public void Accept_GivenDraw_VisitsDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomePlayers = { new GamePlayer() },
            HomeScore = 3,
            AwayPlayers = { new GamePlayer() },
            AwayScore = 1,
        });
        _game.Matches.Add(new GameMatch
        {
            HomePlayers = { new GamePlayer() },
            HomeScore = 0,
            AwayPlayers = { new GamePlayer() },
            AwayScore = 3,
        });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGameDraw(_visitorScope.Object, _game.Home, _game.Away));
    }

    [Test]
    public void Accept_GivenNoScoreDraw_DoesNotVisitDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomePlayers = { new GamePlayer() },
            HomeScore = 0,
            AwayPlayers = { new GamePlayer() },
            AwayScore = 0,
        });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGameDraw(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>(), It.IsAny<GameTeam>()), Times.Never);
        visitor.Verify(v => v.VisitGameWinner(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
        visitor.Verify(v => v.VisitGameLoser(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void Accept_GivenNoPlayerDraw_DoesNotVisitDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomeScore = 1,
            AwayScore = 1,
        });

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitGameDraw(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void Accept_GivenAccoladesCount_Visits180s()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new GamePlayer();
        _game.AccoladesCount = true;
        _game.OneEighties.Add(player);

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitOneEighty(_visitorScope.Object, player));
    }

    [Test]
    public void Accept_GivenAccoladesCount_VisitsHiChecks()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new NotablePlayer();
        _game.AccoladesCount = true;
        _game.Over100Checkouts.Add(player);

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitHiCheckout(_visitorScope.Object, player));
    }

    [Test]
    public void Accept_GivenAccoladesDoNotCount_DoesNotVisit180s()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new GamePlayer();
        _game.AccoladesCount = false;
        _game.OneEighties.Add(player);

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitOneEighty(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>()), Times.Never);
    }

    [Test]
    public void Accept_GivenAccoladesDoNotCount_DoesNotVisitHiChecks()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new NotablePlayer();
        _game.AccoladesCount = false;
        _game.Over100Checkouts.Add(player);

        _game.Accept(_visitorScope.Object, visitor.Object);

        visitor.Verify(v => v.VisitHiCheckout(It.IsAny<IVisitorScope>(), It.IsAny<NotablePlayer>()), Times.Never);
    }
}
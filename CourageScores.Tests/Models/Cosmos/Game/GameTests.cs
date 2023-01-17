using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class GameTests
{
    private CourageScores.Models.Cosmos.Game.Game _game = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _game = new CourageScores.Models.Cosmos.Game.Game
        {
            Home = new GameTeam
            {
                Id = Guid.NewGuid(),
            },
            Away = new GameTeam
            {
                Id = Guid.NewGuid(),
            },
            AwaySubmission = new CourageScores.Models.Cosmos.Game.Game(),
            HomeSubmission = new CourageScores.Models.Cosmos.Game.Game(),
        };
    }

    [Test]
    public void Accept_GivenGames_VisitsGame()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGame(_game));
    }

    [Test]
    public void Accept_GivenNoMatches_VisitsTeamsAsPending()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTeam(_game.Home, GameState.Pending));
        visitor.Verify(v => v.VisitTeam(_game.Away, GameState.Pending));
    }

    [Test]
    public void Accept_GivenSomeMatches_VisitsTeamsAsPlayed()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch());

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTeam(_game.Home, GameState.Played));
        visitor.Verify(v => v.VisitTeam(_game.Away, GameState.Played));
    }

    [Test]
    public void Accept_GivenNoManOfTheMatch_DoesNotVisitManOfMatch()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitManOfTheMatch(It.IsAny<Guid>()), Times.Never);
    }

    [Test]
    public void Accept_GivenHomeAndAwayManOfTheMatch_VisitsBothManOfMatch()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Home.ManOfTheMatch = Guid.NewGuid();
        _game.Away.ManOfTheMatch = Guid.NewGuid();

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitManOfTheMatch(_game.Home.ManOfTheMatch));
        visitor.Verify(v => v.VisitManOfTheMatch(_game.Away.ManOfTheMatch));
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

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGameWinner(It.IsAny<GameTeam>()), Times.Never);
        visitor.Verify(v => v.VisitGameLost(It.IsAny<GameTeam>()), Times.Never);
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

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGameLost(_game.Home));
        visitor.Verify(v => v.VisitGameWinner(_game.Away));
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

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGameWinner(_game.Home));
        visitor.Verify(v => v.VisitGameLost(_game.Away));
    }

    [Test]
    public void Accept_GivenDraw_VisitsDraw()
    {
        var visitor = new Mock<IGameVisitor>();
        _game.Matches.Add(new GameMatch
        {
            HomePlayers = { new GamePlayer() },
            HomeScore = 1,
            AwayPlayers = { new GamePlayer() },
            AwayScore = 1,
        });

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGameDraw(_game.Home, _game.Away));
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

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGameDraw(It.IsAny<GameTeam>(), It.IsAny<GameTeam>()), Times.Never);
        visitor.Verify(v => v.VisitGameWinner(It.IsAny<GameTeam>()), Times.Never);
        visitor.Verify(v => v.VisitGameLost(It.IsAny<GameTeam>()), Times.Never);
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

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGameDraw(It.IsAny<GameTeam>(), It.IsAny<GameTeam>()), Times.Never);
    }
}
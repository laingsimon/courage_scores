using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class TournamentGameTests
{
    private TournamentGame _game = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _game = new TournamentGame();
    }

    [Test]
    public void Accept_GivenGame_VisitsGame()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitGame(_game));
    }

    [Test]
    public void Accept_GivenHiCheckout_VisitsPlayer()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new NotablePlayer();
        _game.Over100Checkouts.Add(player);

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitHiCheckout(player));
    }

    [Test]
    public void Accept_GivenOneEighties_VisitsPlayer()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new TournamentPlayer();
        _game.OneEighties.Add(player);

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitOneEighty(player));
    }

    [Test]
    public void Accept_GivenSides_VisitsSides()
    {
        var visitor = new Mock<IGameVisitor>();
        var side = new TournamentSide();
        _game.Sides.Add(side);

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitSide(side));
    }

    [Test]
    public void Accept_GivenNoRound_DoesNotVisitRound()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitRound(It.IsAny<TournamentRound>()), Times.Never);
    }

    [Test]
    public void Accept_GivenRound_VisitsRound()
    {
        var visitor = new Mock<IGameVisitor>();
        var round = new TournamentRound();
        _game.Round = round;

        _game.Accept(visitor.Object);

        visitor.Verify(v => v.VisitRound(round));
    }
}
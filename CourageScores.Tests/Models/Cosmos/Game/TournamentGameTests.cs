using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class TournamentGameTests
{
    private TournamentGame _game = null!;
    private static readonly IVisitorScope VisitorScope = new VisitorScope();

    [SetUp]
    public void SetupEachTest()
    {
        _game = new TournamentGame();
    }

    [Test]
    public void Accept_GivenGame_VisitsGame()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitGame(_game));
    }

    [Test]
    public void Accept_GivenHiCheckoutAndAccoladesCount_VisitsHiCheckout()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new NotableTournamentPlayer();
        _game.Over100Checkouts.Add(player);
        _game.AccoladesCount = true;

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitHiCheckout(VisitorScope, player));
    }

    [Test]
    public void Accept_GivenHiCheckoutAndAccoladesDontQualify_DoesNotVisitHiCheckout()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new NotableTournamentPlayer();
        _game.Over100Checkouts.Add(player);
        _game.AccoladesCount = false;

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitHiCheckout(It.IsAny<IVisitorScope>(), player), Times.Never);
    }

    [Test]
    public void Accept_GivenOneEightiesAndAccoladesCount_VisitsOneEighty()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new TournamentPlayer();
        _game.OneEighties.Add(player);
        _game.AccoladesCount = true;

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitOneEighty(VisitorScope, player));
    }

    [Test]
    public void Accept_GivenOneEightiesAndAccoladesDontQualify_DoesNotVisitOneEighty()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new TournamentPlayer();
        _game.OneEighties.Add(player);
        _game.AccoladesCount = false;

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitOneEighty(It.IsAny<IVisitorScope>(), player), Times.Never);
    }

    [Test]
    public void Accept_GivenSides_VisitsSides()
    {
        var visitor = new Mock<IGameVisitor>();
        var side = new TournamentSide();
        _game.Sides.Add(side);

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitSide(VisitorScope, side));
    }

    [Test]
    public void Accept_GivenNoRound_DoesNotVisitRound()
    {
        var visitor = new Mock<IGameVisitor>();

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitRound(It.IsAny<IVisitorScope>(), It.IsAny<TournamentRound>()), Times.Never);
    }

    [Test]
    public void Accept_GivenRound_VisitsRound()
    {
        var visitor = new Mock<IGameVisitor>();
        var round = new TournamentRound();
        _game.Round = round;

        _game.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitRound(VisitorScope, round));
    }
}
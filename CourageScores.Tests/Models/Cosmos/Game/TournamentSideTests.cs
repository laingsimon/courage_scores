using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class TournamentSideTests
{
    private TournamentSide _side = null!;
    private static readonly IVisitorScope VisitorScope = new VisitorScope();

    [SetUp]
    public void SetupEachTest()
    {
        _side = new TournamentSide();
    }

    [Test]
    public void Adapt_GivenSide_ShouldVisitSide()
    {
        var visitor = new Mock<IGameVisitor>();

        _side.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitSide(VisitorScope, _side));
    }

    [Test]
    public void Adapt_GivenPlayers_ShouldVisitPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new TournamentPlayer();
        _side.Players.Add(player);

        _side.Accept(VisitorScope, visitor.Object);

        visitor.Verify(v => v.VisitTournamentPlayer(VisitorScope, player));
    }
}
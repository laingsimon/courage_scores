using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class TournamentSideTests
{
    private TournamentSide _side = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _side = new TournamentSide();
    }

    [Test]
    public void Adapt_GivenSide_ShouldVisitSide()
    {
        var visitor = new Mock<IGameVisitor>();

        _side.Accept(visitor.Object);

        visitor.Verify(v => v.VisitSide(_side));
    }

    [Test]
    public void Adapt_GivenPlayers_ShouldVisitPlayers()
    {
        var visitor = new Mock<IGameVisitor>();
        var player = new TournamentSidePlayer();
        _side.Players.Add(player);

        _side.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTournamentPlayer(player));
    }
}
using CourageScores.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Game;

[TestFixture]
public class TournamentRoundTests
{
    private TournamentRound _round = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _round = new TournamentRound();
    }

    [Test]
    public void Accept_GivenRound_VisitsRound()
    {
        var visitor = new Mock<IGameVisitor>();

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitRound(_round));
    }

    [Test]
    public void Accept_GivenMatches_VisitsMatches()
    {
        var visitor = new Mock<IGameVisitor>();
        var match = new TournamentMatch();
        _round.Matches.Add(match);

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitMatch(match));
    }

    [Test]
    public void Accept_GivenNoNextRound_DoesNotVisitNextRound()
    {
        var visitor = new Mock<IGameVisitor>();

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitRound(It.IsAny<TournamentRound>()));
    }

    [Test]
    public void Accept_GivenANextRound_VisitsNextRound()
    {
        var visitor = new Mock<IGameVisitor>();
        var round = new TournamentRound();
        _round.NextRound = round;

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitRound(round));
    }

    [Test]
    public void Accept_GivenAFinal_VisitsFinal()
    {
        var visitor = new Mock<IGameVisitor>();
        var final = new TournamentMatch();
        _round.Matches.Add(final);
        _round.Sides.Add(new TournamentSide());
        _round.Sides.Add(new TournamentSide());

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitFinal(final));
    }

    [Test]
    public void Accept_GivenSideAWinnerOfFinal_VisitsSideAWinner()
    {
        var visitor = new Mock<IGameVisitor>();
        var sideA = new TournamentSide();
        var sideB = new TournamentSide();
        var final = new TournamentMatch
        {
            ScoreA = 1,
            ScoreB = 0,
            SideA = sideA,
            SideB = sideB,
        };
        _round.Matches.Add(final);
        _round.Sides.AddRange(new[] { sideA, sideB });

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTournamentWinner(sideA));
    }

    [Test]
    public void Accept_GivenSideBWinnerOfFinal_VisitsSideAWinner()
    {
        var visitor = new Mock<IGameVisitor>();
        var sideA = new TournamentSide();
        var sideB = new TournamentSide();
        var final = new TournamentMatch
        {
            ScoreA = 0,
            ScoreB = 1,
            SideA = sideA,
            SideB = sideB,
        };
        _round.Matches.Add(final);
        _round.Sides.AddRange(new[] { sideA, sideB });

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTournamentWinner(sideB));
    }

    [Test]
    public void Accept_GivenScoreDrawInFinal_DoesNotVisitWinner()
    {
        var visitor = new Mock<IGameVisitor>();
        var sideA = new TournamentSide();
        var sideB = new TournamentSide();
        var final = new TournamentMatch
        {
            ScoreA = 1,
            ScoreB = 1,
            SideA = sideA,
            SideB = sideB,
        };
        _round.Matches.Add(final);
        _round.Sides.AddRange(new[] { sideA, sideB });

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTournamentWinner(It.IsAny<TournamentSide>()), Times.Never);
    }

    [Test]
    public void Accept_GivenNoScoreDrawInFinal_DoesNotVisitWinner()
    {
        var visitor = new Mock<IGameVisitor>();
        var sideA = new TournamentSide();
        var sideB = new TournamentSide();
        var final = new TournamentMatch
        {
            ScoreA = 0,
            ScoreB = 0,
            SideA = sideA,
            SideB = sideB,
        };
        _round.Matches.Add(final);
        _round.Sides.AddRange(new[] { sideA, sideB });

        _round.Accept(visitor.Object);

        visitor.Verify(v => v.VisitTournamentWinner(It.IsAny<TournamentSide>()), Times.Never);
    }
}
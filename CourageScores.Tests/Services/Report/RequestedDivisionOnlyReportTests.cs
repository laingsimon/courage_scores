using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class RequestedDivisionOnlyReportTests
{
    [Test]
    public async Task GetReport_ReturnsUnderlyingReport()
    {
        var underlying = new Mock<IReport>();
        var playerLookup = new Mock<IPlayerLookup>();
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        var reportDto = new ReportDto();
        underlying
            .Setup(r => r.GetReport(playerLookup.Object))
            .ReturnsAsync(reportDto);

        var result = await report.GetReport(playerLookup.Object);

        underlying.Verify(r => r.GetReport(playerLookup.Object));
        Assert.That(result, Is.SameAs(reportDto));
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForRequestedDivision_VisitsGame()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);

        report.VisitGame(game);

        underlying.Verify(r => r.VisitGame(game));
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForDifferentDivision_DoesNotVisitGame()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());

        report.VisitGame(game);

        underlying.Verify(r => r.VisitGame(game), Times.Never);
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForSameThenDifferentDivision_DoesNotVisitGame()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitGame(new CourageScores.Models.Cosmos.Game.Game { DivisionId = Guid.NewGuid() });
        report.VisitMatch(new GameMatch());

        underlying.Verify(r => r.VisitGame(It.IsAny<CourageScores.Models.Cosmos.Game.Game>()), Times.Once);
        underlying.Verify(r => r.VisitMatch(It.IsAny<GameMatch>()), Times.Never);
    }

    [Test]
    public void VisitMatch_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var match = new GameMatch();
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitMatch(match);

        underlying.Verify(r => r.VisitMatch(match));
    }

    [Test]
    public void VisitMatch_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var match = new GameMatch();
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitMatch(match);

        underlying.Verify(r => r.VisitMatch(match), Times.Never);
    }

    [Test]
    public void VisitGame_WhenGivenTournamentFixtureForRequestedDivision_VisitsGame()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);

        report.VisitGame(game);

        underlying.Verify(r => r.VisitGame(game));
    }

    [Test]
    public void VisitGame_WhenGivenTournamentFixtureForDifferentDivision_DoesNotVisitGame()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());

        report.VisitGame(game);

        underlying.Verify(r => r.VisitGame(game), Times.Never);
    }

    [Test]
    public void VisitGame_WhenGivenTournamentFixtureForSameThenDifferentDivision_DoesNotVisitGame()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitGame(new TournamentGame { DivisionId = Guid.NewGuid() });
        report.VisitMatch(new TournamentMatch());

        underlying.Verify(r => r.VisitGame(It.IsAny<TournamentGame>()), Times.Once);
        underlying.Verify(r => r.VisitMatch(It.IsAny<TournamentMatch>()), Times.Never);
    }
}
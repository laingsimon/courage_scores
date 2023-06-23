using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class RequestedDivisionOnlyReportTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private static readonly IVisitorScope VisitorScope = new VisitorScope();

    [Test]
    public async Task GetReport_ReturnsUnderlyingReport()
    {
        var underlying = new Mock<IReport>();
        var playerLookup = new Mock<IPlayerLookup>();
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        var reportDto = new ReportDto();
        underlying
            .Setup(r => r.GetReport(playerLookup.Object, _token))
            .ReturnsAsync(reportDto);

        var result = await report.GetReport(playerLookup.Object, _token);

        underlying.Verify(r => r.GetReport(playerLookup.Object, _token));
        Assert.That(result, Is.SameAs(reportDto));
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForRequestedDivision_VisitsGame()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
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
        var game = new CosmosGame
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
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitGame(new CosmosGame { DivisionId = Guid.NewGuid() });
        report.VisitMatch(VisitorScope, new GameMatch());

        underlying.Verify(r => r.VisitGame(It.IsAny<CosmosGame>()), Times.Once);
        underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<GameMatch>()), Times.Never);
    }

    [Test]
    public void VisitMatch_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var match = new GameMatch();
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitMatch(VisitorScope, match);

        underlying.Verify(r => r.VisitMatch(VisitorScope, match));
    }

    [Test]
    public void VisitMatch_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var match = new GameMatch();
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitMatch(VisitorScope, match);

        underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<GameMatch>()), Times.Never);
    }

    [Test]
    public void VisitMatchWin_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitMatchWin(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        underlying.Verify(r => r.VisitMatchWin(VisitorScope, It.IsAny<IReadOnlyCollection<GamePlayer>>(), TeamDesignation.Away, 1, 2));
    }

    [Test]
    public void VisitMatchWin_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitMatchWin(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        underlying.Verify(r => r.VisitMatchWin(VisitorScope, It.IsAny<IReadOnlyCollection<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void VisitMatchLost_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitMatchLost(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        underlying.Verify(r => r.VisitMatchLost(VisitorScope, It.IsAny<IReadOnlyCollection<GamePlayer>>(), TeamDesignation.Away, 1, 2));
    }

    [Test]
    public void VisitMatchLost_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitMatchLost(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        underlying.Verify(r => r.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<IReadOnlyCollection<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void VisitOneEighty_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitOneEighty(VisitorScope, new GamePlayer());

        underlying.Verify(r => r.VisitOneEighty(VisitorScope, It.IsAny<GamePlayer>()));
    }

    [Test]
    public void VisitOneEighty_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitOneEighty(VisitorScope, new GamePlayer());

        underlying.Verify(r => r.VisitOneEighty(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>()), Times.Never);
    }

    [Test]
    public void VisitHiCheckout_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitHiCheckout(VisitorScope, new NotablePlayer());

        underlying.Verify(r => r.VisitHiCheckout(VisitorScope, It.IsAny<NotablePlayer>()));
    }

    [Test]
    public void VisitHiCheckout_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitHiCheckout(VisitorScope, new NotablePlayer());

        underlying.Verify(r => r.VisitHiCheckout(It.IsAny<IVisitorScope>(), It.IsAny<NotablePlayer>()), Times.Never);
    }

    [Test]
    public void VisitTeam_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitTeam(VisitorScope, new GameTeam(), GameState.Pending);

        underlying.Verify(r => r.VisitTeam(VisitorScope, It.IsAny<GameTeam>(), GameState.Pending));
    }

    [Test]
    public void VisitTeam_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitTeam(VisitorScope, new GameTeam(), GameState.Pending);

        underlying.Verify(r => r.VisitTeam(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>(), It.IsAny<GameState>()), Times.Never);
    }

    [Test]
    public void VisitManOfTheMatch_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitManOfTheMatch(VisitorScope, Guid.NewGuid());

        underlying.Verify(r => r.VisitManOfTheMatch(VisitorScope, It.IsAny<Guid>()));
    }

    [Test]
    public void VisitManOfTheMatch_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitManOfTheMatch(VisitorScope, Guid.NewGuid());

        underlying.Verify(r => r.VisitManOfTheMatch(It.IsAny<IVisitorScope>(), It.IsAny<Guid>()), Times.Never);
    }

    [Test]
    public void VisitPlayer_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitPlayer(VisitorScope, new GamePlayer(), 1);

        underlying.Verify(r => r.VisitPlayer(VisitorScope, It.IsAny<GamePlayer>(), 1));
    }

    [Test]
    public void VisitPlayer_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitPlayer(VisitorScope, new GamePlayer(), 1);

        underlying.Verify(r => r.VisitPlayer(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void VisitGameDraw_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitGameDraw(VisitorScope, new GameTeam(), new GameTeam());

        underlying.Verify(r => r.VisitGameDraw(VisitorScope, It.IsAny<GameTeam>(), It.IsAny<GameTeam>()));
    }

    [Test]
    public void VisitGameDraw_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitGameDraw(VisitorScope, new GameTeam(), new GameTeam());

        underlying.Verify(r => r.VisitGameDraw(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void VisitGameWinner_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitGameWinner(VisitorScope, new GameTeam());

        underlying.Verify(r => r.VisitGameWinner(VisitorScope, It.IsAny<GameTeam>()));
    }

    [Test]
    public void VisitGameWinner_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitGameWinner(VisitorScope, new GameTeam());

        underlying.Verify(r => r.VisitGameWinner(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void VisitGameLoser_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitGameLoser(VisitorScope, new GameTeam());

        underlying.Verify(r => r.VisitGameLoser(VisitorScope, It.IsAny<GameTeam>()));
    }

    [Test]
    public void VisitGameLoser_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitGameLoser(VisitorScope, new GameTeam());

        underlying.Verify(r => r.VisitGameLoser(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void VisitDataError_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId);
        report.VisitGame(game);

        report.VisitDataError(VisitorScope, "error");

        underlying.Verify(r => r.VisitDataError(VisitorScope, "error"));
    }

    [Test]
    public void VisitDataError_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitDataError(VisitorScope, "error");

        underlying.Verify(r => r.VisitDataError(It.IsAny<IVisitorScope>(), It.IsAny<string>()), Times.Never);
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
        report.VisitMatch(VisitorScope, new TournamentMatch());

        underlying.Verify(r => r.VisitGame(It.IsAny<TournamentGame>()), Times.Once);
        underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<TournamentMatch>()), Times.Never);
    }

    [Test]
    public void VisitTournamentPlayer_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer());

        underlying.Verify(r => r.VisitTournamentPlayer(VisitorScope, It.IsAny<TournamentPlayer>()));
    }

    [Test]
    public void VisitTournamentPlayer_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer());

        underlying.Verify(r => r.VisitTournamentPlayer(It.IsAny<IVisitorScope>(), It.IsAny<TournamentPlayer>()), Times.Never);
    }

    [Test]
    public void VisitRound_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitRound(VisitorScope, new TournamentRound());

        underlying.Verify(r => r.VisitRound(VisitorScope, It.IsAny<TournamentRound>()));
    }

    [Test]
    public void VisitRound_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitRound(VisitorScope, new TournamentRound());

        underlying.Verify(r => r.VisitRound(It.IsAny<IVisitorScope>(), It.IsAny<TournamentRound>()), Times.Never);
    }

    [Test]
    public void VisitFinal_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitFinal(VisitorScope, new TournamentMatch());

        underlying.Verify(r => r.VisitFinal(VisitorScope, It.IsAny<TournamentMatch>()));
    }

    [Test]
    public void VisitFinal_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitFinal(VisitorScope, new TournamentMatch());

        underlying.Verify(r => r.VisitFinal(It.IsAny<IVisitorScope>(), It.IsAny<TournamentMatch>()), Times.Never);
    }

    [Test]
    public void VisitTournamentWinner_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitTournamentWinner(VisitorScope, new TournamentSide());

        underlying.Verify(r => r.VisitTournamentWinner(VisitorScope, It.IsAny<TournamentSide>()));
    }

    [Test]
    public void VisitTournamentWinner_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitTournamentWinner(VisitorScope, new TournamentSide());

        underlying.Verify(r => r.VisitTournamentWinner(It.IsAny<IVisitorScope>(), It.IsAny<TournamentSide>()), Times.Never);
    }

    [Test]
    public void VisitMatch_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitMatch(VisitorScope, new TournamentMatch());

        underlying.Verify(r => r.VisitMatch(VisitorScope, It.IsAny<TournamentMatch>()));
    }

    [Test]
    public void VisitMatch_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitMatch(VisitorScope, new TournamentMatch());

        underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<TournamentMatch>()), Times.Never);
    }

    [Test]
    public void VisitSide_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitSide(VisitorScope, new TournamentSide());

        underlying.Verify(r => r.VisitSide(VisitorScope, It.IsAny<TournamentSide>()));
    }

    [Test]
    public void VisitSide_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitSide(VisitorScope, new TournamentSide());

        underlying.Verify(r => r.VisitSide(It.IsAny<IVisitorScope>(), It.IsAny<TournamentSide>()), Times.Never);
    }

    [Test]
    public void VisitDataError_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, game.DivisionId.Value);
        report.VisitGame(game);

        report.VisitDataError(VisitorScope, "error");

        underlying.Verify(r => r.VisitDataError(VisitorScope, "error"));
    }

    [Test]
    public void VisitDataError_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var underlying = new Mock<IReport>();
        var game = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var report = new RequestedDivisionOnlyReport(underlying.Object, Guid.NewGuid());
        report.VisitGame(game);

        report.VisitDataError(VisitorScope, "error");

        underlying.Verify(r => r.VisitDataError(It.IsAny<IVisitorScope>(), It.IsAny<string>()), Times.Never);
    }
}
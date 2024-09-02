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
    private static readonly CosmosGame Game = new CosmosGame
    {
        DivisionId = Guid.NewGuid(),
    };
    private static readonly TournamentGame TournamentGame = new TournamentGame
    {
        DivisionId = Guid.NewGuid(),
    };
    private static readonly IVisitorScope VisitorScope = new VisitorScope();

    private readonly CancellationToken _token = new();
    private Mock<IReport> _underlying = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _underlying = new Mock<IReport>();
    }

    [Test]
    public async Task GetReport_ReturnsUnderlyingReport()
    {
        var playerLookup = new Mock<IPlayerLookup>();
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        var reportDto = new ReportDto
        {
            ThisDivisionOnly = false,
        };
        _underlying
            .Setup(r => r.GetReport(playerLookup.Object, _token))
            .ReturnsAsync(reportDto);

        var result = await report.GetReport(playerLookup.Object, _token);

        _underlying.Verify(r => r.GetReport(playerLookup.Object, _token));
        Assert.That(result, Is.SameAs(reportDto));
        Assert.That(result.ThisDivisionOnly, Is.EqualTo(true));
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForRequestedDivision_VisitsGame()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);

        report.VisitGame(Game);

        _underlying.Verify(r => r.VisitGame(Game));
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForDifferentDivision_DoesNotVisitGame()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());

        report.VisitGame(Game);

        _underlying.Verify(r => r.VisitGame(Game), Times.Never);
    }

    [Test]
    public void VisitGame_WhenGivenLeagueFixtureForSameThenDifferentDivision_DoesNotVisitGame()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitGame(new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
        });
        report.VisitMatch(VisitorScope, new GameMatch());

        _underlying.Verify(r => r.VisitGame(It.IsAny<CosmosGame>()), Times.Once);
        _underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<GameMatch>()), Times.Never);
    }

    [Test]
    public void VisitMatch_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var match = new GameMatch();
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitMatch(VisitorScope, match);

        _underlying.Verify(r => r.VisitMatch(VisitorScope, match));
    }

    [Test]
    public void VisitMatch_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var match = new GameMatch();
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitMatch(VisitorScope, match);

        _underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<GameMatch>()), Times.Never);
    }

    [Test]
    public void VisitMatchWin_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitMatchWin(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        _underlying.Verify(r => r.VisitMatchWin(VisitorScope, It.IsAny<IReadOnlyCollection<GamePlayer>>(), TeamDesignation.Away, 1, 2));
    }

    [Test]
    public void VisitMatchWin_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitMatchWin(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        _underlying.Verify(r => r.VisitMatchWin(VisitorScope, It.IsAny<IReadOnlyCollection<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void VisitMatchLost_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitMatchLost(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        _underlying.Verify(r => r.VisitMatchLost(VisitorScope, It.IsAny<IReadOnlyCollection<GamePlayer>>(), TeamDesignation.Away, 1, 2));
    }

    [Test]
    public void VisitMatchLost_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitMatchLost(VisitorScope, Array.Empty<GamePlayer>(), TeamDesignation.Away, 1, 2);

        _underlying.Verify(r => r.VisitMatchLost(It.IsAny<IVisitorScope>(), It.IsAny<IReadOnlyCollection<GamePlayer>>(), It.IsAny<TeamDesignation>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void VisitOneEighty_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitOneEighty(VisitorScope, new GamePlayer());

        _underlying.Verify(r => r.VisitOneEighty(VisitorScope, It.IsAny<GamePlayer>()));
    }

    [Test]
    public void VisitOneEighty_AfterVisitKnockoutGameInAnotherDivision_CallsVisitMatch()
    {
        var knockoutGame = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
            IsKnockout = true,
        };
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(knockoutGame);

        report.VisitOneEighty(VisitorScope, new GamePlayer());

        _underlying.Verify(r => r.VisitOneEighty(VisitorScope, It.IsAny<GamePlayer>()));
    }

    [Test]
    public void VisitOneEighty_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitOneEighty(VisitorScope, new GamePlayer());

        _underlying.Verify(r => r.VisitOneEighty(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>()), Times.Never);
    }

    [Test]
    public void VisitHiCheckout_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitHiCheckout(VisitorScope, new NotablePlayer());

        _underlying.Verify(r => r.VisitHiCheckout(VisitorScope, It.IsAny<NotablePlayer>()));
    }

    [Test]
    public void VisitHiCheckout_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitHiCheckout(VisitorScope, new NotablePlayer());

        _underlying.Verify(r => r.VisitHiCheckout(It.IsAny<IVisitorScope>(), It.IsAny<NotablePlayer>()), Times.Never);
    }

    [Test]
    public void VisitTeam_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitTeam(VisitorScope, new GameTeam(), GameState.Pending);

        _underlying.Verify(r => r.VisitTeam(VisitorScope, It.IsAny<GameTeam>(), GameState.Pending));
    }

    [Test]
    public void VisitTeam_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitTeam(VisitorScope, new GameTeam(), GameState.Pending);

        _underlying.Verify(r => r.VisitTeam(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>(), It.IsAny<GameState>()), Times.Never);
    }

    [Test]
    public void VisitManOfTheMatch_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitManOfTheMatch(VisitorScope, Guid.NewGuid());

        _underlying.Verify(r => r.VisitManOfTheMatch(VisitorScope, It.IsAny<Guid>()));
    }

    [Test]
    public void VisitManOfTheMatch_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitManOfTheMatch(VisitorScope, Guid.NewGuid());

        _underlying.Verify(r => r.VisitManOfTheMatch(It.IsAny<IVisitorScope>(), It.IsAny<Guid>()), Times.Never);
    }

    [Test]
    public void VisitPlayer_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitPlayer(VisitorScope, new GamePlayer(), 1);

        _underlying.Verify(r => r.VisitPlayer(VisitorScope, It.IsAny<GamePlayer>(), 1));
    }

    [Test]
    public void VisitPlayer_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitPlayer(VisitorScope, new GamePlayer(), 1);

        _underlying.Verify(r => r.VisitPlayer(It.IsAny<IVisitorScope>(), It.IsAny<GamePlayer>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void VisitGameDraw_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitGameDraw(VisitorScope, new GameTeam(), new GameTeam());

        _underlying.Verify(r => r.VisitGameDraw(VisitorScope, It.IsAny<GameTeam>(), It.IsAny<GameTeam>()));
    }

    [Test]
    public void VisitGameDraw_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitGameDraw(VisitorScope, new GameTeam(), new GameTeam());

        _underlying.Verify(r => r.VisitGameDraw(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void VisitGameWinner_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitGameWinner(VisitorScope, new GameTeam());

        _underlying.Verify(r => r.VisitGameWinner(VisitorScope, It.IsAny<GameTeam>()));
    }

    [Test]
    public void VisitGameWinner_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitGameWinner(VisitorScope, new GameTeam());

        _underlying.Verify(r => r.VisitGameWinner(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void VisitGameLoser_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitGameLoser(VisitorScope, new GameTeam());

        _underlying.Verify(r => r.VisitGameLoser(VisitorScope, It.IsAny<GameTeam>()));
    }

    [Test]
    public void VisitGameLoser_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitGameLoser(VisitorScope, new GameTeam());

        _underlying.Verify(r => r.VisitGameLoser(It.IsAny<IVisitorScope>(), It.IsAny<GameTeam>()), Times.Never);
    }

    [Test]
    public void VisitDataError_AfterVisitGameForFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Game.DivisionId);
        report.VisitGame(Game);

        report.VisitDataError(VisitorScope, "error");

        _underlying.Verify(r => r.VisitDataError(VisitorScope, "error"));
    }

    [Test]
    public void VisitDataError_AfterVisitGameForFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(Game);

        report.VisitDataError(VisitorScope, "error");

        _underlying.Verify(r => r.VisitDataError(It.IsAny<IVisitorScope>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public void VisitGame_WhenGivenTournamentFixtureForRequestedDivision_VisitsGame()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);

        report.VisitGame(TournamentGame);

        _underlying.Verify(r => r.VisitGame(TournamentGame));
    }

    [Test]
    public void VisitGame_WhenGivenTournamentFixtureForDifferentDivision_DoesNotVisitGame()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());

        report.VisitGame(TournamentGame);

        _underlying.Verify(r => r.VisitGame(TournamentGame), Times.Never);
    }

    [Test]
    public void VisitGame_WhenGivenTournamentFixtureForSameThenDifferentDivision_DoesNotVisitGame()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitGame(new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        });
        report.VisitMatch(VisitorScope, new TournamentMatch());

        _underlying.Verify(r => r.VisitGame(It.IsAny<TournamentGame>()), Times.Once);
        _underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<TournamentMatch>()), Times.Never);
    }

    [Test]
    public void VisitTournamentPlayer_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer());

        _underlying.Verify(r => r.VisitTournamentPlayer(VisitorScope, It.IsAny<TournamentPlayer>()));
    }

    [Test]
    public void VisitTournamentPlayer_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer());

        _underlying.Verify(r => r.VisitTournamentPlayer(It.IsAny<IVisitorScope>(), It.IsAny<TournamentPlayer>()), Times.Never);
    }

    [Test]
    public void VisitRound_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitRound(VisitorScope, new TournamentRound());

        _underlying.Verify(r => r.VisitRound(VisitorScope, It.IsAny<TournamentRound>()));
    }

    [Test]
    public void VisitRound_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitRound(VisitorScope, new TournamentRound());

        _underlying.Verify(r => r.VisitRound(It.IsAny<IVisitorScope>(), It.IsAny<TournamentRound>()), Times.Never);
    }

    [Test]
    public void VisitFinal_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitFinal(VisitorScope, new TournamentMatch());

        _underlying.Verify(r => r.VisitFinal(VisitorScope, It.IsAny<TournamentMatch>()));
    }

    [Test]
    public void VisitFinal_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitFinal(VisitorScope, new TournamentMatch());

        _underlying.Verify(r => r.VisitFinal(It.IsAny<IVisitorScope>(), It.IsAny<TournamentMatch>()), Times.Never);
    }

    [Test]
    public void VisitTournamentWinner_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitTournamentWinner(VisitorScope, new TournamentSide());

        _underlying.Verify(r => r.VisitTournamentWinner(VisitorScope, It.IsAny<TournamentSide>()));
    }

    [Test]
    public void VisitTournamentWinner_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitTournamentWinner(VisitorScope, new TournamentSide());

        _underlying.Verify(r => r.VisitTournamentWinner(It.IsAny<IVisitorScope>(), It.IsAny<TournamentSide>()), Times.Never);
    }

    [Test]
    public void VisitMatch_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitMatch(VisitorScope, new TournamentMatch());

        _underlying.Verify(r => r.VisitMatch(VisitorScope, It.IsAny<TournamentMatch>()));
    }

    [Test]
    public void VisitMatch_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitMatch(VisitorScope, new TournamentMatch());

        _underlying.Verify(r => r.VisitMatch(It.IsAny<IVisitorScope>(), It.IsAny<TournamentMatch>()), Times.Never);
    }

    [Test]
    public void VisitSide_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitSide(VisitorScope, new TournamentSide());

        _underlying.Verify(r => r.VisitSide(VisitorScope, It.IsAny<TournamentSide>()));
    }

    [Test]
    public void VisitSide_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitSide(VisitorScope, new TournamentSide());

        _underlying.Verify(r => r.VisitSide(It.IsAny<IVisitorScope>(), It.IsAny<TournamentSide>()), Times.Never);
    }

    [Test]
    public void VisitSide_WithoutVisitGameForTournamentFixture_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());

        report.VisitSide(VisitorScope, new TournamentSide());

        _underlying.Verify(r => r.VisitSide(It.IsAny<IVisitorScope>(), It.IsAny<TournamentSide>()), Times.Never);
    }

    [Test]
    public void VisitDataError_AfterVisitGameForTournamentFixtureInSameDivision_CallsVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, TournamentGame.DivisionId!.Value);
        report.VisitGame(TournamentGame);

        report.VisitDataError(VisitorScope, "error");

        _underlying.Verify(r => r.VisitDataError(VisitorScope, "error"));
    }

    [Test]
    public void VisitDataError_AfterVisitGameForTournamentFixtureInDifferentDivision_DoesNotVisitMatch()
    {
        var report = new RequestedDivisionOnlyReport(_underlying.Object, Guid.NewGuid());
        report.VisitGame(TournamentGame);

        report.VisitDataError(VisitorScope, "error");

        _underlying.Verify(r => r.VisitDataError(It.IsAny<IVisitorScope>(), It.IsAny<string>()), Times.Never);
    }
}
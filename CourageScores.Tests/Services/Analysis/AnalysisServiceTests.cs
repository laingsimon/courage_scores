using AutoFixture;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Analysis;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Analysis;

[TestFixture]
public class AnalysisServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private AnalysisService _service = null!;
    private Mock<IGenericDataService<TournamentGame, TournamentGameDto>> _tournamentService = null!;
    private Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>> _saygService = null!;
    private Mock<ISaygVisitor> _visitor = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _tournamentService = fixture.FreezeMock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        _saygService = fixture.FreezeMock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>>();
        var visitorFactory = fixture.FreezeMock<ISaygVisitorFactory>();
        _visitor = fixture.FreezeMock<ISaygVisitor>();
        _userService = fixture.FreezeMock<IUserService>();
        _access = [AccessOption.AnalyseMatches];
        var accessService = fixture.FreezeMock<IAccessService>();
        _user = new UserDto();

        _service = fixture.Create<AnalysisService>();

        visitorFactory.Setup(f => f.CreateForRequest(It.IsAny<AnalysisRequestDto>())).Returns(_visitor.Object);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserDto? _, AccessOption access, UserAccessContext _, CancellationToken _) => _user != null && _access.Contains(access));
    }

    [Test]
    public async Task Analyse_WhenLoggedOut_ReturnsUnsuccessful()
    {
        _user = null;
        var request = new AnalysisRequestDto();

        var result = await _service.Analyse(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not logged in"]));
    }

    [Test]
    public async Task Analyse_WhenNotPermitted_ReturnsUnsuccessful()
    {
        _access = _access.Without(AccessOption.AnalyseMatches);
        var request = new AnalysisRequestDto();

        var result = await _service.Analyse(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not permitted"]));
    }

    [Test]
    public async Task Analyse_GivenNoIds_ShouldReturnSuccess()
    {
        var request = new AnalysisRequestDto();

        var result = await _service.Analyse(request, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Analyse_GivenMissingTournamentId_ShouldReturnFailure()
    {
        var tournamentId = Guid.NewGuid();
        var request = new AnalysisRequestDto
        {
            TournamentIds = [tournamentId],
        };
        _tournamentService.Setup(s => s.Get(tournamentId, _token)).ReturnsAsync(() => null);

        var result = await _service.Analyse(request, _token);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task Analyse_WhenTokenCancelled_ShouldAbortAndReturnUnsuccessul()
    {
        var source = new CancellationTokenSource();
        var tournament1 = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
        };
        var tournament2 = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
        };
        var request = new AnalysisRequestDto
        {
            TournamentIds = [tournament1.Id, tournament2.Id],
        };
        _tournamentService.Setup(s => s.Get(tournament1.Id, source.Token)).Callback(source.Cancel).ReturnsAsync(tournament1);
        _tournamentService.Setup(s => s.Get(tournament2.Id, source.Token)).ReturnsAsync(tournament2);
        _userService.Setup(s => s.GetUser(source.Token)).ReturnsAsync(() => _user);

        var result = await _service.Analyse(request, source.Token);

        _tournamentService.Verify(s => s.Get(tournament1.Id, source.Token));
        _tournamentService.Verify(s => s.Get(tournament2.Id, source.Token), Times.Never);
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task Analyse_WhenTournamentNotFound_ShouldContinueToNextFixture()
    {
        var missingTournamentId = Guid.NewGuid();
        var tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
        };
        var request = new AnalysisRequestDto
        {
            TournamentIds = [missingTournamentId, tournament.Id],
        };
        _tournamentService.Setup(s => s.Get(missingTournamentId, _token)).ReturnsAsync(() => null);
        _tournamentService.Setup(s => s.Get(tournament.Id, _token)).ReturnsAsync(tournament);

        var result = await _service.Analyse(request, _token);

        _tournamentService.Verify(s => s.Get(tournament.Id, _token));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task Analyse_WhenTournamentNotFound_ShouldCallFinish()
    {
        var missingTournamentId = Guid.NewGuid();
        var request = new AnalysisRequestDto
        {
            TournamentIds = [missingTournamentId],
        };
        _tournamentService.Setup(s => s.Get(missingTournamentId, _token)).ReturnsAsync(() => null);

        await _service.Analyse(request, _token);

        _visitor.Verify(v => v.Finished(It.IsAny<AnalysisResponseDto>()));
    }

    [Test]
    public async Task Analyse_WhenExceptionThrownDuringAnalysis_ShouldReturnFailure()
    {
        var tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
            Round = new TournamentRoundDto
            {
                Matches =
                {
                    new TournamentMatchDto
                    {
                        SaygId = Guid.NewGuid(),
                    }
                }
            },
        };
        var secondTournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
        };
        var request = new AnalysisRequestDto
        {
            TournamentIds = [tournament.Id, secondTournament.Id],
        };
        _tournamentService.Setup(s => s.Get(tournament.Id, _token)).ReturnsAsync(tournament);
        _tournamentService.Setup(s => s.Get(secondTournament.Id, _token)).ReturnsAsync(secondTournament);
        _saygService.Setup(s => s.Get(It.IsAny<Guid>(), _token)).Throws(new InvalidOperationException("Any old exception"));

        var result = await _service.Analyse(request, _token);

        _tournamentService.Verify(s => s.Get(secondTournament.Id, _token));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task Analyse_WhenExceptionThrownDuringAnalysis_ShouldContinueToNextFixture()
    {
        var missingTournamentId = Guid.NewGuid();
        var tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
        };
        var request = new AnalysisRequestDto
        {
            TournamentIds = [missingTournamentId, tournament.Id],
        };
        _tournamentService.Setup(s => s.Get(missingTournamentId, _token)).ReturnsAsync(() => null);
        _tournamentService.Setup(s => s.Get(tournament.Id, _token)).ReturnsAsync(tournament);

        var result = await _service.Analyse(request, _token);

        _tournamentService.Verify(s => s.Get(tournament.Id, _token));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task Analyse_WhenExceptionThrownDuringAnalysis_ShouldCallFinish()
    {
        var tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
            Round = new TournamentRoundDto
            {
                Matches =
                {
                    new TournamentMatchDto
                    {
                        SaygId = Guid.NewGuid(),
                    }
                }
            },
        };
        var request = new AnalysisRequestDto
        {
            TournamentIds = [tournament.Id],
        };
        _tournamentService.Setup(s => s.Get(tournament.Id, _token)).ReturnsAsync(tournament);
        _saygService.Setup(s => s.Get(It.IsAny<Guid>(), _token)).Throws(new InvalidOperationException("Any old exception"));

        await _service.Analyse(request, _token);

        _visitor.Verify(v => v.Finished(It.IsAny<AnalysisResponseDto>()));
    }

    [Test]
    public async Task Analyse_WhenTournamentFound_ShouldReturnSuccess()
    {
        var tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
        };
        var request = new AnalysisRequestDto
        {
            TournamentIds = [tournament.Id],
        };
        _tournamentService.Setup(s => s.Get(tournament.Id, _token)).ReturnsAsync(tournament);

        var result = await _service.Analyse(request, _token);

        Assert.That(result.Success, Is.True);
    }
}

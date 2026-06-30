using AutoFixture;
using CourageScores.Common;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Report;
using CourageScores.Services;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Report;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class ReportFactoryTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private HashSet<AccessOption> _access = null!;
    private ReportFactory _factory = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        var userService = fixture.FreezeMock<IUserService>();
        fixture.FreezeMock<ICachingSeasonService>();
        fixture.FreezeMock<ICachingDivisionService>();
        fixture.FreezeMock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        fixture.FreezeMock<ITournamentTypeResolver>();
        _access = [AccessOption.RunReports];
        var accessService = fixture.FreezeMock<IAccessService>();
        _factory = fixture.Create<ReportFactory>();

        _user = new UserDto();
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, CancellationToken _) => _user != null && _access.Contains(access));
    }

    [Test]
    public async Task GetReports_WhenLoggedOut_DoesNotReturnManOfMatch()
    {
        _user = null;

        var reports = await _factory.GetReports(new ReportRequestDto(), _token).ToList();

        Assert.That(reports, Has.None.TypeOf<ManOfTheMatchReport>());
    }

    [Test]
    public async Task GetReports_WhenNotPermitted_DoesNotReturnManOfMatch()
    {
        _access = _access.Without(AccessOption.ManageScores);

        var reports = await _factory.GetReports(new ReportRequestDto(), _token).ToList();

        Assert.That(reports, Has.None.TypeOf<ManOfTheMatchReport>());
    }

    [Test]
    public async Task GetReports_WhenPermitted_DoesNotReturnManOfMatch()
    {
        _access = _access.With(AccessOption.ManageScores);

        var reports = await _factory.GetReports(new ReportRequestDto(), _token).ToList();

        Assert.That(reports, Has.One.TypeOf<ManOfTheMatchReport>());
    }
}

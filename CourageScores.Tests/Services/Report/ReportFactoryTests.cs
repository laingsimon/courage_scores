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
    private Mock<IUserService> _userService = null!;
    private Mock<ICachingDivisionService> _divisionService = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<IGenericDataService<TournamentGame, TournamentGameDto>> _tournamentService = null!;
    private Mock<ITournamentTypeResolver> _tournamentTypeResolver = null!;
    private Mock<IAccessService> _accessService = null!;
    private HashSet<AccessOption> _access = null!;
    private ReportFactory _factory = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _seasonService = new Mock<ICachingSeasonService>();
        _divisionService = new Mock<ICachingDivisionService>();
        _tournamentService = new Mock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        _tournamentTypeResolver = new Mock<ITournamentTypeResolver>();
        _access = [AccessOption.RunReports];
        _accessService = new Mock<IAccessService>();
        _factory = new ReportFactory(
            _userService.Object,
            _divisionService.Object,
            _seasonService.Object,
            _tournamentService.Object,
            _tournamentTypeResolver.Object,
            _accessService.Object);

        _user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _accessService
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

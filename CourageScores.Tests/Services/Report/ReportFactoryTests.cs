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
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IUserService> _userService = null!;
    private Mock<ICachingDivisionService> _divisionService = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<IGenericDataService<TournamentGame, TournamentGameDto>> _tournamentService = null!;
    private ReportFactory _factory = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _seasonService = new Mock<ICachingSeasonService>();
        _divisionService = new Mock<ICachingDivisionService>();
        _tournamentService = new Mock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        _factory = new ReportFactory(
            _userService.Object,
            _divisionService.Object,
            _seasonService.Object,
            _tournamentService.Object);

        _user = new UserDto
        {
            Access = new AccessDto
            {
                RunReports = true,
            },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
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
        _user!.Access!.ManageScores = false;

        var reports = await _factory.GetReports(new ReportRequestDto(), _token).ToList();

        Assert.That(reports, Has.None.TypeOf<ManOfTheMatchReport>());
    }

    [Test]
    public async Task GetReports_WhenPermitted_DoesNotReturnManOfMatch()
    {
        _user!.Access!.ManageScores = true;

        var reports = await _factory.GetReports(new ReportRequestDto(), _token).ToList();

        Assert.That(reports, Has.One.TypeOf<ManOfTheMatchReport>());
    }
}
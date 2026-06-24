using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Report;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Report;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class ReportServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IUserService> _userService = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<ICachingDivisionService> _divisionService = null!;
    private Mock<IGenericRepository<CosmosGame>> _gameRepository = null!;
    private Mock<TimeProvider> _clock = null!;
    private Mock<IGenericRepository<TournamentGame>> _tournamentRepository = null!;
    private Mock<IReportFactory> _reportFactory = null!;
    private Mock<IReport> _report = null!;
    private ReportService _service = null!;
    private UserDto? _user;
    private SeasonDto _season = null!;
    private DivisionDto _division = null!;
    private CosmosGame _game1 = null!;
    private CosmosGame _game2 = null!;
    private TournamentGame _tournament1 = null!;
    private Mock<IAccessService> _accessService = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _access = [AccessOption.RunReports];
        _accessService = new Mock<IAccessService>();
        _seasonService = new Mock<ICachingSeasonService>();
        _divisionService = new Mock<ICachingDivisionService>();
        _gameRepository = new Mock<IGenericRepository<CosmosGame>>();
        _tournamentRepository = new Mock<IGenericRepository<TournamentGame>>();
        _clock = new Mock<TimeProvider>();
        _reportFactory = new Mock<IReportFactory>();
        _report = new Mock<IReport>();
        _service = new ReportService(
            _userService.Object,
            _seasonService.Object,
            _divisionService.Object,
            _gameRepository.Object,
            _tournamentRepository.Object,
            _clock.Object,
            _reportFactory.Object,
            _accessService.Object);

        _user = new UserDto();
        _season = new SeasonDtoBuilder().Build();
        _division = new DivisionDtoBuilder().Build();
        _game1 = new CosmosGame
        {
            Home = new GameTeam(),
            Away = new GameTeam(),
        };
        _game2 = new CosmosGame
        {
            Home = new GameTeam(),
            Away = new GameTeam(),
            Matches =
            {
                new GameMatch(),
            },
        };
        _tournament1 = new TournamentGame();

        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _divisionService.Setup(s => s.Get(_division.Id, _token)).ReturnsAsync(_division);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable(_game1, _game2));
        _tournamentRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable(_tournament1));
        _reportFactory
            .Setup(f => f.GetReports(It.IsAny<ReportRequestDto>(), _token))
            .Returns(TestUtilities.AsyncEnumerable(_report.Object));
        _report.Setup(r => r.GetReport(It.IsAny<IPlayerLookup>(), _token))
            .ReturnsAsync(new ReportDto
            {
                Name = "Report",
            });
        _accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, CancellationToken _) => _user != null && _access.Contains(access));
    }

    [Test]
    public async Task GetReports_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;
        var request = new ReportRequestDto
        {
            SeasonId = _season.Id,
            DivisionId = _division.Id,
        };

        var reports = await _service.GetReports(request, _token);

        Assert.That(reports.Reports, Is.Empty);
        Assert.That(reports.Messages, Is.EquivalentTo(["Not permitted"]));
    }

    [Test]
    public async Task GetReports_WhenNotPermitted_ReturnsNotPermitted()
    {
        _access = _access.Without(AccessOption.RunReports);
        var request = new ReportRequestDto
        {
            SeasonId = _season.Id,
            DivisionId = _division.Id,
        };

        var reports = await _service.GetReports(request, _token);

        Assert.That(reports.Reports, Is.Empty);
        Assert.That(reports.Messages, Is.EquivalentTo(["Not permitted"]));
    }

    [Test]
    public async Task GetReports_WhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var request = new ReportRequestDto
        {
            SeasonId = Guid.NewGuid(),
            DivisionId = _division.Id,
        };

        var reports = await _service.GetReports(request, _token);

        Assert.That(reports.Reports, Is.Empty);
        Assert.That(reports.Messages, Is.EquivalentTo(["Season not found"]));
    }

    [Test]
    public async Task GetReports_WhenDivisionNotFound_ReturnsDivisionNotFound()
    {
        var request = new ReportRequestDto
        {
            SeasonId = _season.Id,
            DivisionId = Guid.NewGuid(),
        };

        var reports = await _service.GetReports(request, _token);

        Assert.That(reports.Reports, Is.Empty);
        Assert.That(reports.Messages, Is.EquivalentTo(["Division not found"]));
    }

    [Test]
    public async Task GetReports_GivenInsufficientPermissions_DoesNotReturnManOfTheMatch()
    {
        var request = new ReportRequestDto
        {
            SeasonId = _season.Id,
            DivisionId = _division.Id,
        };
        _access = _access.Without(AccessOption.ManageScores);

        var reports = await _service.GetReports(request, _token);

        Assert.That(reports.Reports, Is.Not.Empty);
        Assert.That(reports.Reports.Select(r => r.Name), Is.EqualTo(["Report"]));
    }
}

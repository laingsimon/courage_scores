using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Division;
using CourageScores.Services.Game;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using CourageScores.Tests.Models.Adapters;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season;

namespace CourageScores.Tests.Services.Season;

[TestFixture]
public class SeasonServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IGenericRepository<CosmosSeason>> _repository = null!;
    private IAdapter<CosmosSeason, SeasonDto> _adapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<IDivisionService> _divisionService = null!;
    private Mock<IGameService> _gameService = null!;
    private Mock<ISystemClock> _clock = null!;
    private UserDto? _user;
    private SeasonService _service = null!;
    private CosmosSeason _season = null!;
    private List<TeamDto> _allTeams = null!;
    private SeasonDto _seasonDto = null!;
    private TeamDto _team1 = null!;
    private TeamDto _team2 = null!;
    private TeamDto _team3 = null!;
    private DivisionDataDto _divisionData = null!;
    private List<GameDto> _someGames = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = true,
            }
        };
        _season = new CosmosSeason
        {
            Id = Guid.NewGuid(),
        };
        _divisionData = new DivisionDataDto();
        _seasonDto = new SeasonDto
        {
            Id = _season.Id
        };
        _team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1",
            Address = "Team1-Address",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = _season.Id,
                    DivisionId = _divisionData.Id,
                }
            }
        };
        _team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2",
            Address = "Team2-Address",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = _season.Id,
                    DivisionId = _divisionData.Id,
                }
            }
        };
        _team3 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 3",
            Address = "Team1-Address",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = _season.Id,
                    DivisionId = _divisionData.Id,
                }
            }
        };

        _repository = new Mock<IGenericRepository<CosmosSeason>>();
        _adapter = new MockAdapter<CosmosSeason, SeasonDto>(_season, _seasonDto);
        _auditingHelper = new Mock<IAuditingHelper>();
        _userService = new Mock<IUserService>();
        _teamService = new Mock<ITeamService>();
        _divisionService = new Mock<IDivisionService>();
        _gameService = new Mock<IGameService>();
        _clock = new Mock<ISystemClock>();
        _allTeams = new List<TeamDto>
        {
            _team1,
            _team2,
            _team3,
        };
        _someGames = new List<GameDto>();

        _service = new SeasonService(
            _repository.Object,
            _adapter,
            _userService.Object,
            _auditingHelper.Object,
            _teamService.Object,
            _divisionService.Object,
            _gameService.Object,
            _clock.Object);

        _repository.Setup(r => r.Get(_season.Id, _token)).ReturnsAsync(_season);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _teamService.Setup(s => s.GetAll(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_allTeams.ToArray()));
        _divisionService.Setup(s => s.GetDivisionData(It.IsAny<DivisionDataFilter>(), _token))
            .ReturnsAsync(() => _divisionData);
        _gameService.Setup(s => s.GetWhere(It.IsAny<string>(), _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_someGames.ToArray()));
    }

    [Test]
    public async Task ProposeGames_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;
        var request = new AutoProvisionGamesRequest();

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not permitted"));
    }

    [Test]
    public async Task ProposeGames_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user!.Access!.ManageGames = false;
        var request = new AutoProvisionGamesRequest();

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not permitted"));
    }

    [Test]
    public async Task ProposeGames_WhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var request = new AutoProvisionGamesRequest
        {
            SeasonId = Guid.NewGuid(),
            DivisionId = _divisionData.Id,
        };

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result.Errors, Has.Member("Season could not be found"));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task ProposeGames_WhenDivisionNotFound_ReturnsDivisionNotFound()
    {
        var request = new AutoProvisionGamesRequest
        {
            SeasonId = _season.Id,
            DivisionId = Guid.NewGuid(),
        };

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result.Errors, Has.Member("Division could not be found"));
        Assert.That(result.Success, Is.False);
    }

    [TestCase(0)]
    [TestCase(1)]
    public async Task ProposeGames_WhenLessThan2Teams_ReturnsUnableToPropose(int teamCount)
    {
        var request = new AutoProvisionGamesRequest
        {
            SeasonId = _season.Id,
            DivisionId = _divisionData.Id,
        };
        _allTeams.Clear();
        _allTeams.AddRange(Enumerable.Range(0, teamCount).Select(c => new TeamDto
        {
            Name = $"Team {c}",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = _season.Id,
                    DivisionId = _divisionData.Id,
                }
            }
        }));

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result.Errors, Has.Member("Insufficient teams"));
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task ProposeGames_WhenGiven2OrMoreTeams_ReturnsCorrectly()
    {
        var request = new AutoProvisionGamesRequest
        {
            SeasonId = _season.Id,
            StartDate = new DateTime(2001, 02, 03),
            WeekDay = DayOfWeek.Thursday,
            NumberOfLegs = 2,
            DivisionId = _divisionData.Id,
        };

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    public async Task GetLatest_WhenNoSeasons_ReturnsNull()
    {
        var today = new DateTime(2001, 02, 03);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(today, TimeSpan.Zero));
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosSeason>());

        var result = await _service.GetLatest(_token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetLatest_WhenSeasonStartsToday_ReturnsSeason()
    {
        var today = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = today;
        _seasonDto.EndDate = today.AddDays(10);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(today, TimeSpan.Zero));
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetLatest(_token);

        Assert.That(result, Is.SameAs(_seasonDto));
    }

    [Test]
    public async Task GetLatest_WhenSeasonEndsToday_ReturnsSeason()
    {
        var today = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = today.AddDays(-10);
        _seasonDto.EndDate = today;
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(today, TimeSpan.Zero));
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetLatest(_token);

        Assert.That(result, Is.SameAs(_seasonDto));
    }

    [Test]
    public async Task GetLatest_WhenSeasonStartsBeforeTodayAndEndsAfterToday_ReturnsSeason()
    {
        var today = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = today.AddDays(-10);
        _seasonDto.EndDate = today.AddDays(10);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(today, TimeSpan.Zero));
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetLatest(_token);

        Assert.That(result, Is.SameAs(_seasonDto));
    }

    [Test]
    public async Task GetLatest_WhenSeasonStartsTomorrow_ReturnsNull()
    {
        var today = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = today.AddDays(1);
        _seasonDto.EndDate = today.AddDays(10);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(today, TimeSpan.Zero));
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetLatest(_token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetLatest_WhenSeasonEndedYesterday_ReturnsNull()
    {
        var today = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = today.AddDays(-10);
        _seasonDto.EndDate = today.AddDays(-1);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(today, TimeSpan.Zero));
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetLatest(_token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetForDate_WhenNoSeasons_ReturnsNull()
    {
        var date = new DateTime(2001, 02, 03);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosSeason>());

        var result = await _service.GetForDate(date, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetForDate_WhenSeasonStartsToday_ReturnsSeason()
    {
        var date = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = date;
        _seasonDto.EndDate = date.AddDays(10);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetForDate(date, _token);

        Assert.That(result, Is.SameAs(_seasonDto));
    }

    [Test]
    public async Task GetForDate_WhenSeasonEndsToday_ReturnsSeason()
    {
        var date = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = date.AddDays(-10);
        _seasonDto.EndDate = date;
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetForDate(date, _token);

        Assert.That(result, Is.SameAs(_seasonDto));
    }

    [Test]
    public async Task GetForDate_WhenSeasonStartsBeforeTodayAndEndsAfterToday_ReturnsSeason()
    {
        var date = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = date.AddDays(-10);
        _seasonDto.EndDate = date.AddDays(10);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetForDate(date, _token);

        Assert.That(result, Is.SameAs(_seasonDto));
    }

    [Test]
    public async Task GetForDate_WhenSeasonStartsTomorrow_ReturnsNull()
    {
        var date = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = date.AddDays(1);
        _seasonDto.EndDate = date.AddDays(10);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetForDate(date, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetForDate_WhenSeasonEndedYesterday_ReturnsNull()
    {
        var date = new DateTime(2001, 02, 03);
        _seasonDto.StartDate = date.AddDays(-10);
        _seasonDto.EndDate = date.AddDays(-1);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));

        var result = await _service.GetForDate(date, _token);

        Assert.That(result, Is.Null);
    }
}
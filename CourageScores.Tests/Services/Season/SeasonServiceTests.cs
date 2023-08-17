using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Tests.Models.Adapters;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Tests.Services.Season;

[TestFixture]
public class SeasonServiceTests
{
    private readonly CancellationToken _token = new();
    private Mock<IGenericRepository<CosmosSeason>> _repository = null!;
    private IAdapter<CosmosSeason, SeasonDto> _adapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ISystemClock> _clock = null!;
    private UserDto? _user;
    private SeasonService _service = null!;
    private CosmosSeason _season = null!;
    private SeasonDto _seasonDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = true,
            },
        };
        _season = new CosmosSeason
        {
            Id = Guid.NewGuid(),
        };
        _seasonDto = new SeasonDto
        {
            Id = _season.Id,
            StartDate = new DateTime(2001, 01, 01),
            EndDate = new DateTime(2001, 05, 20),
        };

        _repository = new Mock<IGenericRepository<CosmosSeason>>();
        _adapter = new MockAdapter<CosmosSeason, SeasonDto>(_season, _seasonDto);
        _auditingHelper = new Mock<IAuditingHelper>();
        _userService = new Mock<IUserService>();
        _clock = new Mock<ISystemClock>();

        _service = new SeasonService(
            _repository.Object,
            _adapter,
            _userService.Object,
            _auditingHelper.Object,
            _clock.Object,
            new ActionResultAdapter());

        _repository.Setup(r => r.Get(_season.Id, _token)).ReturnsAsync(_season);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
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
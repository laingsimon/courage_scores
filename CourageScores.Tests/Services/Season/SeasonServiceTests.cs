using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Tests.Services.Season;

[TestFixture]
public class SeasonServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IGenericRepository<CosmosSeason>> _repository = null!;
    private Mock<TimeProvider> _clock = null!;
    private UserDto? _user;
    private SeasonService _service = null!;
    private CosmosSeason _season = null!;
    private SeasonDto _seasonDto = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _access = [AccessOption.ManageGames];
        _user = new UserDto();
        _season = new CosmosSeason
        {
            Id = Guid.NewGuid(),
        };
        _seasonDto = new SeasonDtoBuilder(_season.Id)
            .WithDates(new DateTime(2001, 01, 01), new DateTime(2001, 05, 20))
            .Build();

        _repository = fixture.FreezeMock<IGenericRepository<CosmosSeason>>();
        var adapter = new MockAdapter<CosmosSeason, SeasonDto>(_season, _seasonDto);
        fixture.Register<IAdapter<CosmosSeason, SeasonDto>>(() => adapter);
        var userService = fixture.FreezeMock<IUserService>();
        var accessService = fixture.FreezeMock<IAccessService>();
        _clock = fixture.FreezeMock<TimeProvider>();

        _service = fixture.Create<SeasonService>();

        _repository.Setup(r => r.Get(_season.Id, _token)).ReturnsAsync(_season);
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(_user, It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync((UserDto _, AccessOption option, UserAccessContext _, CancellationToken _) => _user != null && _access.Contains(option));
    }

    [Test]
    public async Task GetLatest_WhenNoSeasons_ReturnsNull()
    {
        var today = new DateTime(2001, 02, 03);
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today, TimeSpan.Zero));
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
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today, TimeSpan.Zero));
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
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today, TimeSpan.Zero));
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
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today, TimeSpan.Zero));
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
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today, TimeSpan.Zero));
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
        _clock.Setup(c => c.GetUtcNow()).Returns(new DateTimeOffset(today, TimeSpan.Zero));
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

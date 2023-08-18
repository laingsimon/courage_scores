using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Status;
using CourageScores.Services.Season;
using CourageScores.Services.Status;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Status;

[TestFixture]
public class StatusServiceTests
{
    private readonly CancellationToken _token = new();
    private StatusService _service = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private IMemoryCache _memoryCache = null!;
    private ApplicationMetrics _applicationMetrics = null!;

    [SetUp]
    public void BeforeEachTest()
    {
        _seasonService = new Mock<ISeasonService>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _applicationMetrics = ApplicationMetrics.Create();
        _service = new StatusService(_seasonService.Object, _memoryCache, _applicationMetrics);
    }

    [Test]
    public async Task GetStatus_WhenDatabaseInaccessible_ShouldReturnFalse()
    {
        _seasonService.Setup(s => s.GetLatest(_token)).ThrowsAsync(new Exception("Inaccessible"));

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Inaccessible"));
        Assert.That(result.Result!.DatabaseAccess, Is.False);
    }

    [Test]
    public async Task GetStatus_WhenOutOfSeason_ShouldReturnDatabaseAccessible()
    {
        _seasonService.Setup(s => s.GetLatest(_token)).ReturnsAsync(() => null);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.DatabaseAccess, Is.True);
    }

    [Test]
    public async Task GetStatus_WhenInSeason_ShouldReturnDatabaseAccessible()
    {
        var season = new SeasonDto();
        _seasonService.Setup(s => s.GetLatest(_token)).ReturnsAsync(season);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.DatabaseAccess, Is.True);
    }

    [Test]
    public async Task GetStatus_WhenOutOfSeason_ShouldReturnOutOfSeason()
    {
        _seasonService.Setup(s => s.GetLatest(_token)).ReturnsAsync(() => null);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.SeasonStatus, Is.EqualTo(ServiceStatusDto.SeasonStatusEnum.OutOfSeason));
    }

    [Test]
    public async Task GetStatus_WhenLatestSeasonIsNotCurrent_ShouldReturnOutOfSeason()
    {
        var season = new SeasonDto
        {
            IsCurrent = false,
        };
        _seasonService.Setup(s => s.GetLatest(_token)).ReturnsAsync(season);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.SeasonStatus, Is.EqualTo(ServiceStatusDto.SeasonStatusEnum.OutOfSeason));
    }

    [Test]
    public async Task GetStatus_WhenInSeason_ShouldReturnInSeason()
    {
        var season = new SeasonDto
        {
            IsCurrent = true,
        };
        _seasonService.Setup(s => s.GetLatest(_token)).ReturnsAsync(season);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.SeasonStatus, Is.EqualTo(ServiceStatusDto.SeasonStatusEnum.InSeason));
    }

    [Test]
    public async Task GetStatus_WhenCalled_ReturnsStartAndUpTime()
    {
        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.StartTime, Is.EqualTo(_applicationMetrics.Started));
        Assert.That(result.Result!.UpTime, Is.LessThanOrEqualTo(_applicationMetrics.UpTime));
    }

    [Test]
    public async Task GetStatus_WhenCalled_ReturnsCacheSize()
    {
        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.CachedEntries, Is.EqualTo(0));
    }

    [Test]
    public async Task GetStatus_WhenUnableToRetrieveCacheSize_ReturnsNullCacheSize()
    {
        _service = new StatusService(
            _seasonService.Object,
            new Mock<IMemoryCache>().Object, // not a MemoryCache instance
            _applicationMetrics);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Result!.CachedEntries, Is.Null);
    }
}
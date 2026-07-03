using System.Diagnostics.CodeAnalysis;
using AutoFixture;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Status;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using CourageScores.Services.Season;
using CourageScores.Services.Status;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Status;

[TestFixture]
public class StatusServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private StatusService _service = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private ICache _cache = null!;
    private ApplicationMetrics _applicationMetrics = null!;
    private UserDto? _user;
    private Mock<ICollection<IWebSocketContract>> _sockets = null!;

    [SetUp]
    public void BeforeEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = new UserDto();

        _seasonService = fixture.FreezeMock<ISeasonService>();
        var userService = fixture.FreezeMock<IUserService>();
        _cache = new InterceptingMemoryCache(new MemoryCache(new MemoryCacheOptions()));
        fixture.Register(() => _cache);
        _applicationMetrics = ApplicationMetrics.Create();
        fixture.Register(() => _applicationMetrics);
        _sockets = fixture.FreezeMock<ICollection<IWebSocketContract>>();

        _service = fixture.Create<StatusService>();

        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
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
        var season = new SeasonDtoBuilder().Build();
        _seasonService.Setup(s => s.GetLatest(_token)).ReturnsAsync(season);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.SeasonStatus, Is.EqualTo(ServiceStatusDto.SeasonStatusEnum.OutOfSeason));
    }

    [Test]
    public async Task GetStatus_WhenInSeason_ShouldReturnInSeason()
    {
        var season = new SeasonDtoBuilder().IsCurrent().Build();
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
    public async Task GetStatus_WhenCalled_ReturnsOpenSocketCount()
    {
        _sockets.Setup(s => s.Count).Returns(1);

        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.OpenSockets, Is.EqualTo(1));
    }

    [Test]
    public async Task GetStatus_WhenCalled_ReturnsCacheSize()
    {
        var result = await _service.GetStatus(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.CachedEntries, Is.EqualTo(0));
    }

    [Test]
    public async Task ClearCache_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;

        var result = await _service.ClearCache(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(["Not permitted"]));
    }

    [Test]
    public async Task ClearCache_WhenLoggedIn_ClearsEmptyCache()
    {
        var result = await _service.ClearCache(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["0 entries removed"]));
    }

    [Test]
    public async Task ClearCache_WhenLoggedIn_ClearsCache()
    {
        var key = new CacheEntryKey(name: "NAME")
        {
            Address = "ADDRESS",
        };
        _cache.GetOrCreate(key, _ => key);

        var result = await _service.ClearCache(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["1 entries removed"]));
        Assert.That(result.Result!.Keys.Count, Is.EqualTo(1));
        var cachedKey = result.Result.Keys[0];
        Assert.That(cachedKey.Keys, Is.EquivalentTo(["_name", "_nullStringField", "Address", "NullStringProperty"]));
        Assert.That(cachedKey["_name"], Is.EqualTo("NAME"));
        Assert.That(cachedKey["Address"], Is.EqualTo("ADDRESS"));
        Assert.That(cachedKey["_nullStringField"], Is.Null);
        Assert.That(cachedKey["NullStringProperty"], Is.Null);
    }

    [Test]
    public async Task GetCachedEntries_WhenLoggedOut_ReturnsNotPermitted()
    {
        _user = null;

        var result = await _service.GetCachedEntries(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(expected: ["Not permitted"]));
    }

    [Test]
    public async Task GetCachedEntries_WhenLoggedIn_ReturnsEmptyList()
    {
        var result = await _service.GetCachedEntries(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Empty);
    }

    [Test]
    public async Task GetCachedEntries_WhenLoggedIn_ReturnsCachedEntry()
    {
        var key = new CacheEntryKey(name: "NAME")
        {
            Address = "ADDRESS",
        };
        _cache.GetOrCreate(key, _ => key);

        var result = await _service.GetCachedEntries(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.Count, Is.EqualTo(1));
        var cachedKey = result.Result[0];
        Assert.That(cachedKey.Keys, Is.EquivalentTo(["_name", "_nullStringField", "Address", "NullStringProperty"]));
        Assert.That(cachedKey["_name"], Is.EqualTo("NAME"));
        Assert.That(cachedKey["Address"], Is.EqualTo("ADDRESS"));
        Assert.That(cachedKey["_nullStringField"], Is.Null);
        Assert.That(cachedKey["NullStringProperty"], Is.Null);
    }

    [SuppressMessage("ReSharper", "UnusedMember.Local")]
    [SuppressMessage("ReSharper", "NotAccessedField.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class CacheEntryKey
    {
#pragma warning disable IDE0052
        private readonly string _name;
        private readonly string? _nullStringField;
#pragma warning restore IDE0052

        public CacheEntryKey(string name, string? nullStringField = null)
        {
            _name = name;
            _nullStringField = nullStringField;
        }

        public string? Address { get; set; }
        public string? NullStringProperty { get; set; }

#pragma warning disable CA1822
        public string WriteOnlyProperty
#pragma warning restore CA1822
        {
            // ReSharper disable once ValueParameterNotUsed
            set
            {
                // intentional, to prove that write-only properties don't cause a problem for ExposeFieldsAndProperties()
            }
        }
    }
}

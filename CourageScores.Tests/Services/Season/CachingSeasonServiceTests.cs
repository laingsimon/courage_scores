using AutoFixture;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season;

[TestFixture]
public class CachingSeasonServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly SeasonDto? _latestSeason = new();
    private CachingSeasonService _service = null!;
    private Mock<ISeasonService> _underlyingService = null!;
    private UserDto? _user;
    private HttpContext? _context;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        var userService = fixture.FreezeMock<IUserService>();
        _underlyingService = fixture.FreezeMock<ISeasonService>();
        var cache = new InterceptingMemoryCache(new MemoryCache(new MemoryCacheOptions()));
        fixture.Register<ICache>(() => cache);
        var httpContextAccessor = fixture.FreezeMock<IHttpContextAccessor>();
        _context = new DefaultHttpContext();
        _user = null;

        _service = fixture.Create<CachingSeasonService>();

        httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _context);
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _underlyingService
            .Setup(s => s.GetLatest(_token))
            .ReturnsAsync(() => _latestSeason);
    }

    [Test]
    public async Task GetLatest_WhenLoggedIn_BypassesCache()
    {
        _user = new UserDto();
        var result1 = await _service.GetLatest(_token);
        var result2 = await _service.GetLatest(_token);

        _underlyingService.Verify(s => s.GetLatest(_token), Times.Exactly(2));
        Assert.That(result1, Is.SameAs(result2));
        Assert.That(result1, Is.SameAs(_latestSeason));
    }

    [Test]
    public async Task GetLatest_WhenLoggedOut_ReturnsSecondRequestFromCache()
    {
        var result1 = await _service.GetLatest(_token);

        var result2 = await _service.GetLatest(_token);

        _underlyingService.Verify(s => s.GetLatest(_token), Times.Exactly(1));
        Assert.That(result1, Is.SameAs(result2));
        Assert.That(result1, Is.SameAs(_latestSeason));
    }

    [Test]
    public async Task GetLatest_GivenNoCacheRequestWhenLoggedOut_BypassesCache()
    {
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");
        var result1 = await _service.GetLatest(_token);
        var result2 = await _service.GetLatest(_token);

        _underlyingService.Verify(s => s.GetLatest(_token), Times.Exactly(2));
        Assert.That(result1, Is.SameAs(result2));
        Assert.That(result1, Is.SameAs(_latestSeason));
    }

    [Test]
    public async Task GetForDate_ShouldNotBeCached()
    {
        var date = new DateTime(2001, 02, 03);

        await _service.GetForDate(date, _token);
        await _service.GetForDate(date, _token);

        _underlyingService.Verify(s => s.GetForDate(date, _token), Times.Exactly(2));
    }
}

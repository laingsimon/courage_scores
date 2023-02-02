using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
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
    private readonly CancellationToken _token = new CancellationToken();
    private readonly ActionResultDto<List<DivisionFixtureDateDto>> _proposeGamesFixtures = new();
    private readonly SeasonDto? _latestSeason = new();
    private CachingSeasonService _service = null!;
    private Mock<ISeasonService> _underlyingService = null!;
    private IMemoryCache _cache = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private UserDto? _user;
    private HttpContext? _context;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _underlyingService = new Mock<ISeasonService>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _context = new DefaultHttpContext();
        _user = null;

        _service = new CachingSeasonService(
            _underlyingService.Object,
            _cache,
            _userService.Object,
            _httpContextAccessor.Object);

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _context);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _underlyingService
            .Setup(s => s.ProposeGames(It.IsAny<AutoProvisionGamesRequest>(), _token))
            .ReturnsAsync(() => _proposeGamesFixtures);
        _underlyingService
            .Setup(s => s.GetLatest(_token))
            .ReturnsAsync(() => _latestSeason);
    }

    [Test]
    public async Task ProposeGames_WhenCalled_CallsUnderlyingService()
    {
        var request = new AutoProvisionGamesRequest();

        var result = await _service.ProposeGames(request, _token);

        Assert.That(result, Is.SameAs(_proposeGamesFixtures));
        _underlyingService.Verify(s => s.ProposeGames(request, _token), Times.Once);
    }

    [Test]
    public async Task GetLatest_WhenLoggedIn_BypassesCache()
    {
        _user = new UserDto
        {
            Access = new AccessDto()
        };
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
}
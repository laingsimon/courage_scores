using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Team;

[TestFixture]
public class CachingTeamServiceTests
{
    private readonly CancellationToken _token = new();
    private readonly List<TeamDto> _seasonIdOnlyTeams = new()
    {
        new TeamDto(),
    };
    private readonly List<TeamDto> _seasonIdAndDivisionIdTeams = new()
    {
        new TeamDto(),
        new TeamDto(),
    };
    private CachingTeamService _service = null!;
    private Mock<ITeamService> _underlyingService = null!;
    private IMemoryCache _cache = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private UserDto? _user;
    private HttpContext? _context;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _underlyingService = new Mock<ITeamService>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _context = new DefaultHttpContext();
        _user = null;

        _service = new CachingTeamService(
            _underlyingService.Object,
            _cache,
            _userService.Object,
            _httpContextAccessor.Object);

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _context);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _underlyingService
            .Setup(s => s.GetTeamsForSeason(It.IsAny<Guid>(), _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_seasonIdOnlyTeams.ToArray()));
        _underlyingService
            .Setup(s => s.GetTeamsForSeason(It.IsAny<Guid>(), It.IsAny<Guid>(), _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_seasonIdAndDivisionIdTeams.ToArray()));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonIdWhenLoggedIn_BypassesCache()
    {
        var seasonId = Guid.NewGuid();
        _user = _user.SetAccess();

        var result = await _service.GetTeamsForSeason(seasonId, _token).ToList();

        _underlyingService.Verify(s => s.GetTeamsForSeason(seasonId, _token));
        Assert.That(result, Is.EquivalentTo(_seasonIdOnlyTeams));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonIdWhenLoggedOut_ReturnsFromCache()
    {
        var seasonId = Guid.NewGuid();
        // set in the cache
        await _service.GetTeamsForSeason(seasonId, _token).ToList();

        // get from cache
        var result = await _service.GetTeamsForSeason(seasonId, _token).ToList();

        _underlyingService.Verify(s => s.GetTeamsForSeason(seasonId, _token), Times.Once);
        Assert.That(result, Is.EquivalentTo(_seasonIdOnlyTeams));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonIdWhenLoggedOutAndNoCacheHeader_UpdatesCache()
    {
        var seasonId = Guid.NewGuid();
        // set in the cache
        await _service.GetTeamsForSeason(seasonId, _token).ToList();
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");
        _seasonIdOnlyTeams.Add(new TeamDto());

        // get from cache
        var result = await _service.GetTeamsForSeason(seasonId, _token).ToList();

        _underlyingService.Verify(s => s.GetTeamsForSeason(seasonId, _token), Times.Exactly(2));
        Assert.That(result, Is.EquivalentTo(_seasonIdOnlyTeams));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonAndDivisionIdWhenLoggedIn_BypassesCache()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        _user = _user.SetAccess();

        var result = await _service.GetTeamsForSeason(seasonId, divisionId, _token).ToList();

        _underlyingService.Verify(s => s.GetTeamsForSeason(seasonId, divisionId, _token));
        Assert.That(result, Is.EquivalentTo(_seasonIdAndDivisionIdTeams));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonAndDivisionIdWhenLoggedOut_ReturnsFromCache()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        // set in the cache
        await _service.GetTeamsForSeason(seasonId, divisionId, _token).ToList();

        // get from cache
        var result = await _service.GetTeamsForSeason(seasonId, divisionId, _token).ToList();

        _underlyingService.Verify(s => s.GetTeamsForSeason(seasonId, divisionId, _token), Times.Once);
        Assert.That(result, Is.EquivalentTo(_seasonIdAndDivisionIdTeams));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonAndDivisionIdWhenLoggedOutAndNoCacheHeader_UpdatesCache()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        // set in the cache
        await _service.GetTeamsForSeason(seasonId, divisionId, _token).ToList();
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");
        _seasonIdAndDivisionIdTeams.Add(new TeamDto());

        // get from cache
        var result = await _service.GetTeamsForSeason(seasonId, divisionId, _token).ToList();

        _underlyingService.Verify(s => s.GetTeamsForSeason(seasonId, divisionId, _token), Times.Exactly(2));
        Assert.That(result, Is.EquivalentTo(_seasonIdAndDivisionIdTeams));
    }
}
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class CachingDivisionServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DivisionDataDto _divisionData = new();
    private readonly DivisionDto? _divisionDto = new();
    private readonly List<DivisionDto> _allDivisions = new() { new DivisionDto(), new DivisionDto() };
    private readonly List<DivisionDto> _someDivisions = new() { new DivisionDto() };
    private CachingDivisionService _service = null!;
    private Mock<IDivisionService> _underlyingService = null!;
    private IMemoryCache _cache = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private UserDto? _user;
    private HttpContext? _context;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _underlyingService = new Mock<IDivisionService>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _context = new DefaultHttpContext();
        _user = null;

        _service = new CachingDivisionService(
            _underlyingService.Object,
            _cache,
            _userService.Object,
            _httpContextAccessor.Object);

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _context);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _underlyingService
            .Setup(s => s.GetDivisionData(It.IsAny<DivisionDataFilter>(), _token))
            .ReturnsAsync(() => _divisionData);
        _underlyingService
            .Setup(s => s.Get(It.IsAny<Guid>(), _token))
            .ReturnsAsync(() => _divisionDto);
        _underlyingService
            .Setup(s => s.GetAll(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_allDivisions.ToArray()));
        _underlyingService
            .Setup(s => s.GetWhere(It.IsAny<string>(), _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_someDivisions.ToArray()));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedIn_BypassesCache()
    {
        _user = new UserDto { Access = new AccessDto() };
        var divisionId = Guid.NewGuid();
        var seasonId = Guid.NewGuid();
        var result1 = await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);

        var result2 = await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);

        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Exactly(2));
        Assert.That(result1, Is.SameAs(_divisionData));
        Assert.That(result2, Is.SameAs(result1));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedOut_ReturnsSecondRequestFromCache()
    {
        var divisionId = Guid.NewGuid();
        var seasonId = Guid.NewGuid();
        var result1 = await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);

        var result2 = await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);

        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Once);
        Assert.That(result1, Is.SameAs(_divisionData));
        Assert.That(result2, Is.SameAs(result1));
    }

    [Test]
    public async Task GetDivisionData_GivenNoCacheRequestWhenLoggedOut_BypassesCache()
    {
        var divisionId = Guid.NewGuid();
        var seasonId = Guid.NewGuid();
        var result1 = await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");

        var result2 = await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);

        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Exactly(2));
        Assert.That(result2, Is.SameAs(result1));
        Assert.That(result2, Is.SameAs(_divisionData));
    }

    [Test]
    public async Task Get_WhenLoggedIn_ReturnsSecondRequestFromCache()
    {
        _user = new UserDto { Access = new AccessDto() };
        var divisionId = Guid.NewGuid();
        var result1 = await _service.Get(divisionId, _token);

        var result2 = await _service.Get(divisionId, _token);

        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(1));
        Assert.That(result2, Is.SameAs(result1));
        Assert.That(result2, Is.SameAs(_divisionDto));
    }

    [Test]
    public async Task Get_WhenLoggedOut_ReturnsSecondRequestFromCache()
    {
        var divisionId = Guid.NewGuid();
        var result1 = await _service.Get(divisionId, _token);

        var result2 = await _service.Get(divisionId, _token);

        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Once);
        Assert.That(result2, Is.SameAs(result1));
        Assert.That(result2, Is.SameAs(_divisionDto));
    }

    [Test]
    public async Task Get_GivenNoCacheRequestWhenLoggedOut_BypassesCache()
    {
        var divisionId = Guid.NewGuid();
        var result1 = await _service.Get(divisionId, _token);
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");

        var result2 = await _service.Get(divisionId, _token);

        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(2));
        Assert.That(result2, Is.SameAs(result1));
        Assert.That(result2, Is.SameAs(_divisionDto));
    }

    [Test]
    public async Task GetAll_WhenLoggedIn_ReturnsSecondRequestFromCache()
    {
        _user = new UserDto { Access = new AccessDto() };
        var result1 = await _service.GetAll(_token).ToList();

        var result2 = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token), Times.Exactly(1));
        Assert.That(result2, Is.EqualTo(_allDivisions));
        Assert.That(result2, Is.EqualTo(result1));
    }

    [Test]
    public async Task GetAll_WhenLoggedOut_ReturnsSecondRequestFromCache()
    {
        var result1 = await _service.GetAll(_token).ToList();

        var result2 = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token), Times.Exactly(1));
        Assert.That(result2, Is.EqualTo(_allDivisions));
        Assert.That(result2, Is.EqualTo(result1));
    }

    [Test]
    public async Task GetAll_GivenNoCacheRequestWhenLoggedOut_BypassesCache()
    {
        var result1 = await _service.GetAll(_token).ToList();
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");

        var result2 = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token), Times.Exactly(2));
        Assert.That(result2, Is.EqualTo(_allDivisions));
        Assert.That(result2, Is.EqualTo(result1));
    }

    [Test]
    public async Task GetWhere_WhenLoggedIn_BypassesCache()
    {
        _user = new UserDto { Access = new AccessDto() };
        var result1 = await _service.GetWhere("where", _token).ToList();

        var result2 = await _service.GetWhere("where", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where", _token), Times.Exactly(2));
        Assert.That(result2, Is.EqualTo(_someDivisions));
        Assert.That(result2, Is.EqualTo(result1));
    }

    [Test]
    public async Task GetWhere_WhenLoggedOut_BypassesCache()
    {
        var result1 = await _service.GetWhere("where", _token).ToList();

        var result2 = await _service.GetWhere("where", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where", _token), Times.Exactly(2));
        Assert.That(result2, Is.EqualTo(_someDivisions));
        Assert.That(result2, Is.EqualTo(result1));
    }

    [Test]
    public async Task GetWhere_GivenNoCacheRequestWhenLoggedOut_BypassesCache()
    {
        var result1 = await _service.GetWhere("where", _token).ToList();
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");

        var result2 = await _service.GetWhere("where", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where", _token), Times.Exactly(2));
        Assert.That(result2, Is.EqualTo(_someDivisions));
        Assert.That(result2, Is.EqualTo(result1));
    }

    [Test]
    public async Task Upsert_WhenCalled_InvalidatesCaches()
    {
        var divisionId = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<CourageScores.Models.Cosmos.Division, int>>().Object;
        var result1 = await _service.Get(divisionId, _token);
        var result2 = await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(1));
        Assert.That(result2, Is.SameAs(result1));

        await _service.Upsert(divisionId, command, _token);

        _underlyingService.Verify(s => s.Upsert(divisionId, command, _token));
        var result3 = await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(2));
        Assert.That(result3, Is.SameAs(result1));
    }

    [Test]
    public async Task Delete_WhenCalled_InvalidatesCaches()
    {
        var divisionId = Guid.NewGuid();
        var result1 = await _service.Get(divisionId, _token);
        var result2 = await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(1));
        Assert.That(result2, Is.SameAs(result1));

        await _service.Delete(divisionId, _token);

        _underlyingService.Verify(s => s.Delete(divisionId, _token));
        var result3 = await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(2));
        Assert.That(result3, Is.SameAs(result1));
    }

    [Test]
    public async Task InvalidateCaches_GivenNeitherSeasonNorDivisionId_DoesNothing()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);

        await _service.InvalidateCaches(divisionId: null, seasonId: null);

        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Exactly(1));
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(1));
    }

    [Test]
    public async Task InvalidateCaches_GivenSeasonId_InvalidatesCachesForSeason()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);

        await _service.InvalidateCaches(divisionId: null, seasonId: seasonId);

        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Exactly(2));
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(1));
    }

    [Test]
    public async Task InvalidateCaches_GivenDivisionId_InvalidatesCachesForDivision()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);

        await _service.InvalidateCaches(divisionId: divisionId, seasonId: null);

        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Exactly(2));
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(2));
    }

    [Test]
    public async Task InvalidateCaches_GivenSeasonAndDivisionId_InvalidatesCachesForSeasonAndDivision()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);

        await _service.InvalidateCaches(divisionId: divisionId, seasonId: seasonId);

        await _service.GetDivisionData(new DivisionDataFilter { DivisionId = divisionId, SeasonId = seasonId }, _token);
        await _service.Get(divisionId, _token);
        _underlyingService.Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.SeasonId == seasonId && f.DivisionId == divisionId), _token), Times.Exactly(2));
        _underlyingService.Verify(s => s.Get(divisionId, _token), Times.Exactly(2));
    }
}
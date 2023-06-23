using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services;

[TestFixture]
public class CachingDataServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private TeamDto? _dto = new TeamDto();
    private readonly List<TeamDto> _someDtos = new() { new TeamDto() };
    private readonly List<TeamDto> _allDtos = new() { new TeamDto(), new TeamDto() };
    private CachingDataService<CosmosTeam, TeamDto> _service = null!;
    private Mock<IGenericDataService<CosmosTeam, TeamDto>> _underlyingService = null!;
    private IMemoryCache _cache = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private UserDto? _user;
    private HttpContext? _context;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _underlyingService = new Mock<IGenericDataService<CosmosTeam, TeamDto>>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _context = new DefaultHttpContext();
        _user = null;

        _service = new CachingDataService<CosmosTeam, TeamDto>(
            _underlyingService.Object,
            _cache,
            _userService.Object,
            _httpContextAccessor.Object);

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _context);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _underlyingService
            .Setup(s => s.Get(It.IsAny<Guid>(), _token))
            .ReturnsAsync(() => _dto);
        _underlyingService
            .Setup(s => s.GetAll(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_allDtos.ToArray()));
        _underlyingService
            .Setup(s => s.GetWhere(It.IsAny<string>(), _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_someDtos.ToArray()));
        _underlyingService
            .Setup(s => s.Delete(It.IsAny<Guid>(), _token))
            .ReturnsAsync(() => new ActionResultDto<TeamDto>());
        _underlyingService
            .Setup(s => s.Upsert(It.IsAny<Guid>(), It.IsAny<IUpdateCommand<CosmosTeam, int>>(), _token))
            .ReturnsAsync(() => new ActionResultDto<TeamDto>());
    }

    [Test]
    public async Task Get_WhenLoggedIn_BypassesCache()
    {
        var id = Guid.NewGuid();
        _user = new UserDto
        {
            Access = new AccessDto()
        };

        var result = await _service.Get(id, _token);

        _underlyingService.Verify(s => s.Get(id, _token));
        Assert.That(result, Is.SameAs(_dto));
    }

    [Test]
    public async Task Get_WhenLoggedOut_ReturnsFromCache()
    {
        var id = Guid.NewGuid();
        // set in the cache
        var firstResult = await _service.Get(id, _token);
        _dto = new TeamDto();

        // get from cache
        var result = await _service.Get(id, _token);

        _underlyingService.Verify(s => s.Get(id, _token), Times.Once);
        Assert.That(result, Is.SameAs(firstResult));
    }

    [Test]
    public async Task Get_WhenLoggedOutAndNoCacheHeader_UpdatesCache()
    {
        var id = Guid.NewGuid();
        // set in the cache
        await _service.Get(id, _token);
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");
        _dto = new TeamDto();

        // get from cache
        var result = await _service.Get(id, _token);

        _underlyingService.Verify(s => s.Get(id, _token), Times.Exactly(2));
        Assert.That(result, Is.SameAs(_dto));
    }

    [Test]
    public async Task GetAll_WhenLoggedIn_BypassesCache()
    {
        _user = new UserDto
        {
            Access = new AccessDto()
        };

        var result = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.EqualTo(_allDtos));
    }

    [Test]
    public async Task GetAll_WhenLoggedOut_ReturnsFromCache()
    {
        // set in the cache
        var firstResult = await _service.GetAll(_token).ToList();
        _allDtos.Add(new TeamDto());

        // get from cache
        var result = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token), Times.Once);
        Assert.That(result, Is.EquivalentTo(firstResult));
    }

    [Test]
    public async Task GetAll_WhenLoggedOutAndNoCacheHeader_UpdatesCache()
    {
        // set in the cache
        await _service.GetAll(_token).ToList();
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");
        _allDtos.Add(new TeamDto());

        // get from cache
        var result = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token), Times.Exactly(2));
        Assert.That(result, Is.EquivalentTo(_allDtos));
    }

    [Test]
    public async Task GetWhere_WhenLoggedIn_BypassesCache()
    {
        _user = new UserDto
        {
            Access = new AccessDto()
        };

        var result = await _service.GetWhere("where", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where", _token));
        Assert.That(result, Is.EqualTo(_someDtos));
    }

    [Test]
    public async Task GetWhere_WhenLoggedOut_ReturnsFromCache()
    {
        // set in the cache
        var firstResult = await _service.GetWhere("where", _token).ToList();
        _someDtos.Add(new TeamDto());

        // get from cache
        var result = await _service.GetWhere("where", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where", _token), Times.Once);
        Assert.That(result, Is.EquivalentTo(firstResult));
    }

    [Test]
    public async Task GetWhere_GivenDifferentClassWhenLoggedOut_DoesntReturnCachedData()
    {
        // set in the cache
        await _service.GetWhere("where1", _token).ToList();
        _someDtos.Add(new TeamDto());

        // get from cache
        var result2 = await _service.GetWhere("where2", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where1", _token), Times.Once);
        _underlyingService.Verify(s => s.GetWhere("where2", _token), Times.Once);
        Assert.That(result2, Is.EquivalentTo(_someDtos));
    }

    [Test]
    public async Task GetWhere_WhenLoggedOutAndNoCacheHeader_UpdatesCache()
    {
        // set in the cache
        await _service.GetWhere("where", _token).ToList();
        _context!.Request.Headers.CacheControl = new StringValues("no-cache");
        _allDtos.Add(new TeamDto());

        // get from cache
        var result = await _service.GetWhere("where", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("where", _token), Times.Exactly(2));
        Assert.That(result, Is.EquivalentTo(_someDtos));
    }

    [Test]
    public async Task Upsert_WhenCalled_InvalidatesCache()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<CosmosTeam, int>>().Object;
        // set in the cache
        await _service.Get(id, _token);
        _dto = new TeamDto();

        await _service.Upsert(id, command, _token);

        var result2 = await _service.Get(id, _token);
        _underlyingService.Verify(s => s.Get(id, _token), Times.Exactly(2));
        Assert.That(result2, Is.SameAs(_dto));
    }

    [Test]
    public async Task Delete_WhenCalled_InvalidatesCache()
    {
        var id = Guid.NewGuid();
        // set in the cache
        await _service.Get(id, _token);
        _dto = null;

        await _service.Delete(id, _token);

        var result2 = await _service.Get(id, _token);
        _underlyingService.Verify(s => s.Get(id, _token), Times.Exactly(2));
        Assert.That(result2, Is.Null);
    }
}
using CourageScores.Filters;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Filters;

[TestFixture]
public class CacheManagementFilterTests
{
    private readonly ActionExecutedContext _context = new ActionExecutedContext(
        new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor()),
        new List<IFilterMetadata>(),
        new Mock<Controller>().Object);

    private ScopedCacheManagementFlags _flags = null!;
    private CacheManagementFilter _filter = null!;
    private Mock<ICachingDivisionService> _cachingDivisionService = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _flags = new ScopedCacheManagementFlags();
        _cachingDivisionService = new Mock<ICachingDivisionService>();
        _filter = new CacheManagementFilter(_flags, _cachingDivisionService.Object);
    }

    [Test]
    public void OnActionExecuted_WhenCacheShouldBeEvictedForDivision_EvictsTheCache()
    {
        var divisionId = Guid.NewGuid();
        _flags.EvictDivisionDataCacheForDivisionId = divisionId;

        _filter.OnActionExecuted(_context);

        _cachingDivisionService.Verify(s => s.InvalidateCaches(divisionId, null));
    }

    [Test]
    public void OnActionExecuted_WhenCacheShouldBeEvictedForSeason_EvictsTheCache()
    {
        var seasonId = Guid.NewGuid();
        _flags.EvictDivisionDataCacheForSeasonId = seasonId;

        _filter.OnActionExecuted(_context);

        _cachingDivisionService.Verify(s => s.InvalidateCaches(null, seasonId));
    }

    [Test]
    public void OnActionExecuted_WhenCacheShouldBeEvictedForSeasonAndDivision_EvictsTheCache()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        _flags.EvictDivisionDataCacheForSeasonId = seasonId;
        _flags.EvictDivisionDataCacheForDivisionId = divisionId;

        _filter.OnActionExecuted(_context);

        _cachingDivisionService.Verify(s => s.InvalidateCaches(divisionId, seasonId));
    }

    [Test]
    public void OnActionExecuted_WhenNoCacheEvictionExpected_DoesNotEvictCache()
    {
        _filter.OnActionExecuted(_context);

        _cachingDivisionService.Verify(s => s.InvalidateCaches(It.IsAny<Guid?>(), It.IsAny<Guid?>()), Times.Never);
    }
}
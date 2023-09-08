using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Division;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CourageScores.Filters;

public class CacheManagementFilter : IActionFilter
{
    private readonly ICachingDivisionService _cachingDivisionService;
    private readonly ScopedCacheManagementFlags _flags;

    public CacheManagementFilter(ScopedCacheManagementFlags flags, ICachingDivisionService cachingDivisionService)
    {
        _flags = flags;
        _cachingDivisionService = cachingDivisionService;
    }

    [ExcludeFromCodeCoverage]
    public void OnActionExecuting(ActionExecutingContext context)
    {
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        if (_flags.EvictDivisionDataCacheForDivisionId != null || _flags.EvictDivisionDataCacheForSeasonId != null)
        {
            _cachingDivisionService.InvalidateCaches(
                _flags.EvictDivisionDataCacheForDivisionId,
                _flags.EvictDivisionDataCacheForSeasonId).Wait();
        }
    }
}
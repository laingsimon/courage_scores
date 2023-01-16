using System.Diagnostics;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CourageScores.Filters;

public class CacheManagementFilter : IActionFilter
{
    private readonly ScopedCacheManagementFlags _flags;

    public CacheManagementFilter(ScopedCacheManagementFlags flags)
    {
        _flags = flags;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    { }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // react based on the properties in _flags
        Trace.TraceInformation("Processing cache management flags");
    }
}
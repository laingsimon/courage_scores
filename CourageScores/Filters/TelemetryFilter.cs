using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CourageScores.Filters;

[ExcludeFromCodeCoverage]
public class TelemetryFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        var currentActivity = Activity.Current;
        currentActivity?.SetTag("http.request_user_agent", httpContext.Request.Headers.UserAgent.ToString());

        await next();
    }
}

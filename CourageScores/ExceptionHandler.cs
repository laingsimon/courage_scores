using System.Diagnostics.CodeAnalysis;
using System.Net.Mime;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores;

public class ExceptionHandler
{
    private readonly bool _includeErrorDetails;
    private readonly string _debugToken;

    public ExceptionHandler(bool includeErrorDetails, string debugToken)
    {
        _includeErrorDetails = includeErrorDetails;
        _debugToken = debugToken;
    }

    // ReSharper disable once MemberCanBeMadeStatic.Global
    public async Task HandleException(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = MediaTypeNames.Application.Json;

        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();

        var content = new ErrorDetails
        {
            Exception = exceptionHandlerPathFeature?.Error != null
                ? FromException(exceptionHandlerPathFeature.Error, ShouldIncludeStack(context), ShouldIncludeMessage(context))
                : null,
            RequestTimeUtc = DateTime.UtcNow.ToString("O"),
            Request = FromRequest(context.Request, exceptionHandlerPathFeature?.RouteValues),
        };

        await context.Response.WriteAsJsonAsync(
            content,
            new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });
    }

    private bool ShouldIncludeStack(HttpContext httpContext)
    {
        return _includeErrorDetails || HasDebugToken(httpContext);
    }

    private bool ShouldIncludeMessage(HttpContext httpContext)
    {
        return _includeErrorDetails || HasDebugToken(httpContext);
    }

    private bool HasDebugToken(HttpContext httpContext)
    {
        if (string.IsNullOrEmpty(_debugToken))
        {
            return false;
        }

        var debugQueryString = (string)httpContext.Request.Query["debugToken"];
        return !string.IsNullOrEmpty(debugQueryString)
               && debugQueryString.Equals(_debugToken, StringComparison.OrdinalIgnoreCase);
    }

    private static RequestDetails FromRequest(HttpRequest request, RouteValueDictionary? routeValueDictionary)
    {
        return new RequestDetails
        {
            Url = $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}",
            Method = request.Method,
            ContentLength = request.ContentLength,
            ContentType = request.ContentType,
            Controller = (string?)routeValueDictionary?["controller"],
            Action = (string?)routeValueDictionary?["action"],
        };
    }

    private static ExceptionDetails FromException(Exception exception, bool includeStack, bool includeMessage)
    {
        return new ExceptionDetails
        {
            Type = exception.GetType().Name,
            Message = includeMessage ? exception.Message : null,
            StackTrace = includeStack
                ? exception.StackTrace?
                    .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .TakeWhile(stackFrame => !stackFrame.Contains("at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker"))
                    .ToArray()
                : null,
        };
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    public class ErrorDetails
    {
        public ExceptionDetails? Exception { get; init; }
        public RequestDetails Request { get; init; } = null!;
        public string RequestTimeUtc { get; init; } = null!;
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    public class RequestDetails
    {
        public string Url { get; init; } = null!;
        public string Method { get; init; } = null!;
        public long? ContentLength { get; init; }
        public string? ContentType { get; init; }
        public string? Controller { get; init; }
        public string? Action { get; init; }
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    public class ExceptionDetails
    {
        public string Type { get; init; } = null!;
        public string? Message { get; init; }
        public string[]? StackTrace { get; init; }
    }
}
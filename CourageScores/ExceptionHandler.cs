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

        // using static System.Net.Mime.MediaTypeNames;
        context.Response.ContentType = MediaTypeNames.Application.Json;

        var exceptionHandlerPathFeature =
            context.Features.Get<IExceptionHandlerPathFeature>();

        var content = new ErrorDetails
        {
            Exception = exceptionHandlerPathFeature?.Error != null
                ? new ExceptionDetails(exceptionHandlerPathFeature.Error, ShouldIncludeStack(context), ShouldIncludeMessage(context))
                : null,
            RequestTimeUtc = DateTime.UtcNow.ToString("O"),
            Request = new RequestDetails(context.Request, exceptionHandlerPathFeature?.RouteValues),
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
        if (_includeErrorDetails)
        {
            return true;
        }

        if (HasDebugToken(httpContext))
        {
            return true;
        }

        return false;
    }

    private bool ShouldIncludeMessage(HttpContext httpContext)
    {
        if (_includeErrorDetails)
        {
            return true;
        }

        if (HasDebugToken(httpContext))
        {
            return true;
        }

        return false;
    }

    private bool HasDebugToken(HttpContext httpContext)
    {
        if (string.IsNullOrEmpty(_debugToken))
        {
            return false;
        }

        var debugQueryString = (string)httpContext.Request.Query["debugToken"];
        if (string.IsNullOrEmpty(debugQueryString))
        {
            return false;
        }

        return debugQueryString.Equals(_debugToken, StringComparison.OrdinalIgnoreCase);
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class ErrorDetails
    {
        public ExceptionDetails? Exception { get; init; }
        public RequestDetails Request { get; init; } = null!;
        public string RequestTimeUtc { get; init; } = null!;
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class RequestDetails
    {
        public string Url { get; }
        public string Method { get; }
        public long? ContentLength { get; }
        public string? ContentType { get; }
        public string? Controller { get; }
        public string? Action { get; }

        public RequestDetails(HttpRequest request, RouteValueDictionary? routeValueDictionary)
        {
            Url = $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}";
            Method = request.Method;
            ContentLength = request.ContentLength;
            ContentType = request.ContentType;
            Controller = (string?)routeValueDictionary?["controller"];
            Action = (string?)routeValueDictionary?["action"];
        }
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class ExceptionDetails
    {
        public string Type { get; }
        public string? Message { get; }
        public string[]? StackTrace { get; }

        public ExceptionDetails(Exception exception, bool includeStack, bool includeMessage)
        {
            Type = exception.GetType().Name;
            Message = includeMessage ? exception.Message : null;
            if (includeStack)
            {
                StackTrace = exception.StackTrace?
                    .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .TakeWhile(stackFrame =>
                        !stackFrame.Contains("at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker"))
                    .ToArray();
            }
        }
    }
}
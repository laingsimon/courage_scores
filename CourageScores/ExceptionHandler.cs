using System.Diagnostics.CodeAnalysis;
using System.Net.Mime;
using System.Text.Json;
using System.Text.Json.Serialization;
using CourageScores.Services.Error;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores;

public class ExceptionHandler
{
    private readonly bool _includeErrorDetails;

    public ExceptionHandler(bool includeErrorDetails)
    {
        _includeErrorDetails = includeErrorDetails;
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
                ? FromException(exceptionHandlerPathFeature.Error)
                : null,
            RequestTimeUtc = DateTime.UtcNow.ToString("O"),
            Request = FromRequest(context.Request, exceptionHandlerPathFeature?.RouteValues),
        };

        if (exceptionHandlerPathFeature != null)
        {
            await RecordErrorDetails(exceptionHandlerPathFeature, context.RequestServices, context.RequestAborted);
        }

        await context.Response.WriteAsJsonAsync(
            content,
            new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            });
    }

    private static async Task RecordErrorDetails(IExceptionHandlerPathFeature details, IServiceProvider services, CancellationToken token)
    {
        var service = services.GetService<IErrorDetailService>()!;
        await service.AddError(details, token);
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

    private ExceptionDetails FromException(Exception exception)
    {
        return new ExceptionDetails
        {
            Type = exception.GetType().Name,
            Message = _includeErrorDetails ? exception.Message : null,
            StackTrace = _includeErrorDetails
                ? exception.StackTrace?
                    .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
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

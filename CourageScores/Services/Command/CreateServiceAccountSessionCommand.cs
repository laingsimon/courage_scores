using CourageScores.Common;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class CreateServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> _service;
    private readonly IFeatureService _featureService;
    private CreateSessionRequestDto? _request;

    public CreateServiceAccountSessionCommand(
        IUserService userService,
        IHttpContextAccessor httpContextAccessor,
        IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> service,
        IFeatureService featureService)
    {
        _userService = userService;
        _httpContextAccessor = httpContextAccessor;
        _service = service;
        _featureService = featureService;
    }

    public bool RequiresLogin => false;

    public CreateServiceAccountSessionCommand WithRequest(CreateSessionRequestDto request)
    {
        _request = request;
        return this;
    }

    public async Task<ActionResult<ServiceAccountSession>> ApplyUpdate(ServiceAccountSession model, CancellationToken token)
    {
        _request.ThrowIfNull($"Call {nameof(WithRequest)} first");

        var feature = await _featureService.Get(FeatureLookup.ServiceAccountSessions, token);
        if (feature?.ConfiguredValue != "true")
        {
            return Warning("Service account sessions are not allowed");
        }

        var user = await _userService.GetUser(token);
        if (user != null)
        {
            return Warning("Cannot create a session when logged in");
        }

        var httpContext = _httpContextAccessor.HttpContext!;
        var httpRequest = httpContext.Request;
        var cookies = httpRequest.Cookies;

        if (cookies.TryGetValue(ServiceAccountSessionDto.RequestedSessionCookieValueCookieName, out var cookieValue))
        {
            // lookup the existing session and return it
            var existingSession = (await _service.GetWhere($"t.{nameof(model.CookieValue)} = '{cookieValue}'", token).ToList()).SingleOrDefault();
            if (existingSession != null)
            {
                await _service.Delete(existingSession.Id, token);
            }
        }

        model.Id = Guid.NewGuid();
        model.ServiceIpAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        model.ServiceUserAgent = httpRequest.Headers.UserAgent.ToString();
        model.CookieValue = Guid.NewGuid().ToString();
        model.FriendlyName = _request!.FriendlyName;
        httpContext.Response.Cookies.Append(ServiceAccountSessionDto.RequestedSessionCookieValueCookieName, model.CookieValue, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            IsEssential = true,
            Expires = null, // session cookie
        });

        return new ActionResult<ServiceAccountSession>
        {
            Messages = { "Session created" },
            Result = model,
            Success = true,
        };
    }

    private ActionResult<ServiceAccountSession> Warning(string warning)
    {
        return new ActionResult<ServiceAccountSession>
        {
            Warnings = { warning },
        };
    }
}

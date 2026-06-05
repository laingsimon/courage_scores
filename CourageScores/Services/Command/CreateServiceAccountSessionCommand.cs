using CourageScores.Common;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class CreateServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> _service;
    private CreateServiceAccountSessionDto? _request;

    public CreateServiceAccountSessionCommand(
        IUserService userService,
        IHttpContextAccessor httpContextAccessor,
        IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> service)
    {
        _userService = userService;
        _httpContextAccessor = httpContextAccessor;
        _service = service;
    }

    public bool RequiresLogin => false;

    public CreateServiceAccountSessionCommand WithRequest(CreateServiceAccountSessionDto request)
    {
        _request = request;
        return this;
    }

    public async Task<ActionResult<ServiceAccountSession>> ApplyUpdate(ServiceAccountSession model, CancellationToken token)
    {
        _request.ThrowIfNull("Request must be provided");

        var user = await _userService.GetUser(token);
        if (user != null)
        {
            return Warning("Cannot create a session when logged in");
        }

        if (string.IsNullOrEmpty(_request!.PinHash))
        {
            return Warning("Pin hash is missing");
        }

        var httpContext = _httpContextAccessor.HttpContext!;
        var httpRequest = httpContext.Request;
        var cookies = httpRequest.Cookies;

        if (cookies.TryGetValue(ServiceAccountSessionDto.CookieName, out var cookieValue))
        {
            // lookup the existing session and return it
            var existingSession = (await _service.GetWhere($"t.{nameof(model.CookieValue)} = '{cookieValue}'", token).ToList()).SingleOrDefault();
            if (existingSession != null)
            {
                await _service.Delete(existingSession.Id, token);
            }
        }

        model.Id = Guid.NewGuid();
        model.PinHash = _request.PinHash;
        model.ServiceIpAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        model.ServiceUserAgent = httpRequest.Headers.UserAgent.ToString();
        model.CookieValue = Guid.NewGuid().ToString();
        httpContext.Response.Cookies.Append(ServiceAccountSessionDto.CookieName, model.CookieValue, new CookieOptions
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

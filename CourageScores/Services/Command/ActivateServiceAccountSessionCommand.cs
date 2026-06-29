using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;

namespace CourageScores.Services.Command;

public class ActivateServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserRepository _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IFeatureService _featureService;
    private ActivateSessionRequestDto? _request;

    public ActivateServiceAccountSessionCommand(IUserRepository userRepository, IHttpContextAccessor httpContextAccessor, IFeatureService featureService)
    {
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
        _featureService = featureService;
    }

    public bool RequiresLogin => false;

    public ActivateServiceAccountSessionCommand WithRequest(ActivateSessionRequestDto request)
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

        var httpContext = _httpContextAccessor.HttpContext!;
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
        if (ipAddress != model.ServiceIpAddress)
        {
            return Warning("Cannot activate a session from a different location");
        }

        if (_request!.Pin != model.PinFromApprover)
        {
            return Warning("Cannot activate a session with an incorrect pin");
        }

        if (model.ApprovedBy == null)
        {
            return Warning("The session has not been approved");
        }

        if (model.TransientUsername == null)
        {
            return Warning("A user was not created for this session");
        }

        var user = await _userRepository.GetUser(model.TransientUsername!, token);
        if (user == null)
        {
            return Warning("The user for this session was not found");
        }

        httpContext.Response.Cookies.Append(ServiceAccountSessionDto.ActivatedSessionIdCookieName, model.Id.ToString(), new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            IsEssential = true,
            Expires = null, // session cookie
        });
        model.LastRequest = DateTime.UtcNow;
        return new ActionResult<ServiceAccountSession>
        {
            Result = model,
            Success = true,
            Messages = ["Session activated"],
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

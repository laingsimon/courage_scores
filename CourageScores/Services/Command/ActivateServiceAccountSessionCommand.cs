using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class ActivateServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private ActivateSessionRequestDto? _request;

    public ActivateServiceAccountSessionCommand(IUserService userService, IHttpContextAccessor httpContextAccessor)
    {
        _userService = userService;
        _httpContextAccessor = httpContextAccessor;
    }

    public ActivateServiceAccountSessionCommand WithRequest(ActivateSessionRequestDto request)
    {
        _request = request;
        return this;
    }

    public async Task<ActionResult<ServiceAccountSession>> ApplyUpdate(ServiceAccountSession model, CancellationToken token)
    {
        _request.ThrowIfNull($"Call {nameof(WithRequest)} first");

        var ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
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

        var user = await _userService.GetUser(model.TransientUsername!, token);
        if (user == null)
        {
            return Warning("The user for this session was not found");
        }

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

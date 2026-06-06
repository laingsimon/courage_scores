using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class RejectServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserService _userService;
    private RejectServiceAccountSessionDto? _request;

    public RejectServiceAccountSessionCommand(IUserService userService)
    {
        _userService = userService;
    }

    public RejectServiceAccountSessionCommand WithRequest(RejectServiceAccountSessionDto request)
    {
        _request = request;
        return this;
    }

    public async Task<ActionResult<ServiceAccountSession>> ApplyUpdate(ServiceAccountSession model, CancellationToken token)
    {
        _request.ThrowIfNull($"Call {nameof(WithRequest)} first");

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Warning("Not logged in");
        }

        if (user.Access?.LoginServiceAccounts != true)
        {
            return Warning("Not permitted");
        }

        model.RejectedBy = user.Name;
        model.Message = _request!.Reason;
        return new ActionResult<ServiceAccountSession>
        {
            Result = model,
            Success = true,
            Messages = ["Session rejected"],
        };
    }

    private ActionResult<ServiceAccountSession> Warning(string message)
    {
        return new ActionResult<ServiceAccountSession>
        {
            Warnings =
            {
                message,
            }
        };
    }
}

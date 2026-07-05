using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class RejectServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserService _userService;
    private readonly IFeatureService _featureService;
    private readonly IAccessService _accessService;
    private RejectServiceAccountSessionDto? _request;

    public RejectServiceAccountSessionCommand(IUserService userService, IFeatureService featureService, IAccessService accessService)
    {
        _userService = userService;
        _featureService = featureService;
        _accessService = accessService;
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

        if (!await _accessService.HasAccess(user, AccessOption.LoginServiceAccounts, UserAccessContext.Admin(), token))
        {
            return Warning("Not permitted");
        }

        var feature = await _featureService.Get(FeatureLookup.ServiceAccountSessions, token);
        if (feature?.ConfiguredValue != "true")
        {
            return Warning("Service account sessions are not allowed");
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

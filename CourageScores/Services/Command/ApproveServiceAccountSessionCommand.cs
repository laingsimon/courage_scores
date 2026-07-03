using CourageScores.Models;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class ApproveServiceAccountSessionCommand : IUpdateCommand<ServiceAccountSession, ServiceAccountSession>
{
    private readonly IUserService _userService;
    private readonly IUserRepository _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IFeatureService _featureService;
    private readonly IAccessService _accessService;
    private ApproveServiceAccountSessionDto? _request;

    public ApproveServiceAccountSessionCommand(
        IUserService userService,
        IUserRepository userRepository,
        IHttpContextAccessor httpContextAccessor,
        IFeatureService featureService,
        IAccessService accessService)
    {
        _userService = userService;
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
        _featureService = featureService;
        _accessService = accessService;
    }

    public ApproveServiceAccountSessionCommand WithRequest(ApproveServiceAccountSessionDto request)
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

        if (!await _accessService.HasAccess(user, AccessOption.LoginServiceAccounts, token))
        {
            return Warning("Not permitted");
        }

        var feature = await _featureService.Get(FeatureLookup.ServiceAccountSessions, token);
        if (feature?.ConfiguredValue != "true")
        {
            return Warning("Service account sessions are not allowed");
        }

        var ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
        if (model.ServiceIpAddress != ipAddress)
        {
            return Warning("Cannot approve session from a different location");
        }

        if (_request!.Access.Contains(AccessOption.ManageAccess))
        {
            return Warning("Cannot create session with manage access permission");
        }

        if (_request!.Access.Contains(AccessOption.LoginServiceAccounts))
        {
            return Warning("Cannot create session with login service accounts permission");
        }

        var transientUser = new User
        {
            Id = Guid.NewGuid(),
            AccessLevels = _request.Access.ToDictionary(ao => ao, _ => AccessLevel.Granted),
            EmailAddress = $"{model.Id}@couragescores.com",
            Transient = true,
            Name = model.FriendlyName,
            GivenName = model.FriendlyName,
        };
        await _userRepository.UpsertUser(transientUser, token);

        model.ApprovedBy = user.Name;
        model.PinFromApprover = _request.Pin;
        model.TransientUsername = transientUser.EmailAddress;

        return new ActionResult<ServiceAccountSession>
        {
            Result = model,
            Success = true,
            Messages = ["Session approved"],
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

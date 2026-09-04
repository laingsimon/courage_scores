using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public class AccessService : IAccessService
{
    private readonly IAccessLevelAdapter _accessLevelAdapter;

    public AccessService(IAccessLevelAdapter accessLevelAdapter)
    {
        _accessLevelAdapter = accessLevelAdapter;
    }

    public async Task<bool> HasAccess(UserDto? user, AccessOption access, UserAccessContext context, CancellationToken token)
    {
        return await HasAccess(
            user?.AccessLevels.ToDictionary(pair => pair.Key, pair => _accessLevelAdapter.Adapt(pair.Value)),
            access,
            context);
    }

    public async Task<bool> HasAccess(User? user, AccessOption access, UserAccessContext context, CancellationToken token)
    {
        return await HasAccess(
            user?.AccessLevels,
            access,
            context);
    }

    private async Task<bool> HasAccess(Dictionary<AccessOption, AccessLevel>? accessLevels, AccessOption access, UserAccessContext context)
    {
        if (accessLevels == null)
        {
            return false;
        }

        if (!accessLevels.TryGetValue(access, out var accessLevel))
        {
            return false;
        }

        return accessLevel != null && context != null && !token.IsCancellationRequested;
    }
}

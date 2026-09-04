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

        var seasonPermitted = Permitted(accessLevel.SeasonIds, context.SeasonId);
        var divisionPermitted = Permitted(accessLevel.DivisionIds, context.DivisionId);
        var teamPermitted = Permitted(accessLevel.TeamIds, context.TeamId);

        return seasonPermitted && divisionPermitted && teamPermitted;

        static bool Permitted(IReadOnlyCollection<Guid>? accessLevelIds, Guid? contextId)
        {
            if (accessLevelIds?.Count == 0)
            {
                return false;
            }

            if (accessLevelIds == null || contextId == null)
            {
                return true;
            }

            return accessLevelIds.Contains(contextId.Value);
        }
    }
}

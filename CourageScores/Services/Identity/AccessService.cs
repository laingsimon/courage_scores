using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public class AccessService : IAccessService
{
    public Task<bool> HasAccess(UserDto? user, AccessOption access, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(user?.AccessLevels.ContainsKey(access) ?? false);
    }

    public Task<bool> HasAccess(User? user, AccessOption access, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(user?.AccessLevels.ContainsKey(access) ?? false);
    }
}

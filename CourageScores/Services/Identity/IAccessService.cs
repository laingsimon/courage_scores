using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public interface IAccessService
{
    Task<bool> HasAccess(UserDto? user, AccessOption access, UserAccessContext context, CancellationToken token);
    Task<bool> HasAccess(User? user, AccessOption access, UserAccessContext context, CancellationToken token);
}

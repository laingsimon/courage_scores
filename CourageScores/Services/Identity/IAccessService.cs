using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public interface IAccessService
{
    Task<bool> HasAccess(UserDto? user, AccessOption access, CancellationToken token);
}

using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public interface IUserAccessService
{
    Task<bool> HasAccess(AccessOption option, CancellationToken token);

    Task<bool> HasAllAccess(AccessOption[] option, CancellationToken token);
    Task<bool> HasAnyAccess(AccessOption[] options, CancellationToken token);

    UserAccessContext Context { get; }
    UserDto? User { get; }
}

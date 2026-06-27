using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public interface IAccessLevelAdapter
{
    Task<User> AddAccess(User target, UpdateAccessDto source, CancellationToken token);
    Task<User> AddAccess(User target, UserDto source, CancellationToken token);
    Task<UserDto> AddAccess(UserDto target, User source, CancellationToken token);
}

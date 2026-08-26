using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class AccessLevelAdapter : IAccessLevelAdapter
{
    public Task<User> AddAccess(User target, UserDto source, CancellationToken token)
    {
        target.AccessLevels = source.AccessLevels.ToDictionary(pair => pair.Key, AdaptToAccessLevel);
        return Task.FromResult(target);
    }

    public Task<User> AddAccess(User target, UpdateAccessDto source, CancellationToken token)
    {
        target.AccessLevels = source.AccessLevels.ToDictionary(pair => pair.Key, AdaptToAccessLevel);
        return Task.FromResult(target);
    }

    public Task<UserDto> AddAccess(UserDto target, User source, CancellationToken token)
    {
        target.AccessLevels = source.AccessLevels.ToDictionary(pair => pair.Key, AdaptToAccessLevelDto);
        return Task.FromResult(target);
    }

    private static AccessLevelDto AdaptToAccessLevelDto(KeyValuePair<AccessOption, AccessLevel> accessLevel)
    {
        return new AccessLevelDto
        {
            SeasonIds = accessLevel.Value.SeasonIds,
            DivisionIds = accessLevel.Value.DivisionIds,
            TeamIds = accessLevel.Value.TeamIds,
        };
    }

    private static AccessLevel AdaptToAccessLevel(KeyValuePair<AccessOption, AccessLevelDto> accessLevel)
    {
        return new AccessLevel
        {
            SeasonIds = accessLevel.Value.SeasonIds,
            DivisionIds = accessLevel.Value.DivisionIds,
            TeamIds = accessLevel.Value.TeamIds,
        };
    }
}

using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class AccessLevelAdapter : IAccessLevelAdapter
{
    public Task<User> AddAccess(User target, UserDto source, CancellationToken token)
    {
        target.AccessLevels = GetAccessOptions(source.AccessLevels, _ => AccessLevel.Granted);
        return Task.FromResult(target);
    }

    public Task<User> AddAccess(User target, UpdateAccessDto source, CancellationToken token)
    {
        target.AccessLevels = GetAccessOptions(source.AccessLevels, _ => AccessLevel.Granted);
        return Task.FromResult(target);
    }

    public Task<UserDto> AddAccess(UserDto target, User source, CancellationToken token)
    {
        target.AccessLevels = GetAccessOptions(source.AccessLevels, _ => AccessLevelDto.Granted);
        return Task.FromResult(target);
    }

    private static Dictionary<AccessOption, TLevel> GetAccessOptions<TLevel, TSourceAccess>(
        Dictionary<AccessOption, TSourceAccess>? accessLevels,
        Func<AccessOption, TLevel> levelSelector)
    {
        if (accessLevels?.Count > 0)
        {
            return accessLevels.ToDictionary(pair => pair.Key, pair => levelSelector(pair.Key));
        }

        return new Dictionary<AccessOption, TLevel>();
    }
}

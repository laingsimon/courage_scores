using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class AccessLevelAdapter : IAccessLevelAdapter
{
    private readonly ISimpleAdapter<Access, AccessDto> _accessAdapter;

    public AccessLevelAdapter(ISimpleAdapter<Access, AccessDto> accessAdapter)
    {
        _accessAdapter = accessAdapter;
    }

    public async Task<User> AddAccess(User target, UserDto source, CancellationToken token)
    {
        target.AccessLevels = GetAccessOptions(source.Access, _ => AccessLevel.Granted);
        target.Access = await _accessAdapter.Adapt(source.Access ?? new AccessDto(), token);
        return target;
    }

    public async Task<User> AddAccess(User target, UpdateAccessDto source, CancellationToken token)
    {
        target.AccessLevels = GetAccessOptions(source.Access, _ => AccessLevel.Granted);
        target.Access = await _accessAdapter.Adapt(source.Access ?? new AccessDto(), token);
        return target;
    }

    public async Task<UserDto> AddAccess(UserDto target, User source, CancellationToken token)
    {
        target.AccessLevels = GetAccessOptions(source.Access, _ => AccessLevelDto.Granted);
        target.Access = await _accessAdapter.Adapt(source.Access ?? new Access(), token);
        return target;
    }

    private Dictionary<AccessOption, TLevel> GetAccessOptions<TAccess, TLevel>(TAccess access, Func<AccessOption, TLevel> levelSelector)
    {
        if (access == null)
        {
            return new Dictionary<AccessOption, TLevel>();
        }

        return typeof(TAccess).GetProperties()
            .Where(p => p.PropertyType == typeof(bool) && p.GetValue(access) is true)
            .Join(Enum.GetValues<AccessOption>(), p => p.Name, ao => ao.ToString(), (_, ao) => ao, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(ao => ao, levelSelector);
    }
}

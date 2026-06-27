using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class UserAdapter : ISimpleAdapter<User, UserDto>
{
    private readonly IAccessLevelAdapter _accessLevelAdapter;

    public UserAdapter(IAccessLevelAdapter accessLevelAdapter)
    {
        _accessLevelAdapter = accessLevelAdapter;
    }

    public async Task<UserDto> Adapt(User model, CancellationToken token)
    {
        var dto = new UserDto
        {
            Name = model.Name,
            EmailAddress = model.EmailAddress,
            GivenName = model.GivenName,
            TeamId = model.TeamId,
            Transient = model.Transient,
        };

        return await _accessLevelAdapter.AddAccess(dto, model, token);
    }

    public async Task<User> Adapt(UserDto dto, CancellationToken token)
    {
        var user = new User
        {
            Name = dto.Name.TrimOrDefault(),
            EmailAddress = dto.EmailAddress.TrimOrDefault(),
            GivenName = dto.GivenName.TrimOrDefault(),
            TeamId = dto.TeamId,
            Transient = dto.Transient,
        };

        return await _accessLevelAdapter.AddAccess(user, dto, token);
    }
}

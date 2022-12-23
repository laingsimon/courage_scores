using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class UserAdapter : ISimpleAdapter<User, UserDto>
{
    private readonly ISimpleAdapter<Access, AccessDto> _accessAdapter;

    public UserAdapter(ISimpleAdapter<Access, AccessDto> accessAdapter)
    {
        _accessAdapter = accessAdapter;
    }

    public async Task<UserDto> Adapt(User model, CancellationToken token)
    {
        return new UserDto
        {
            Name = model.Name,
            EmailAddress = model.EmailAddress,
            GivenName = model.GivenName,
            Access = model.Access != null ? await _accessAdapter.Adapt(model.Access, token) : null,
            TeamId = model.TeamId,
        };
    }

    public async Task<User> Adapt(UserDto dto, CancellationToken token)
    {
        return new User
        {
            Name = dto.Name.Trim(),
            EmailAddress = dto.EmailAddress.Trim(),
            GivenName = dto.GivenName.Trim(),
            Access = dto.Access != null ? await _accessAdapter.Adapt(dto.Access, token) : null,
        };
    }
}
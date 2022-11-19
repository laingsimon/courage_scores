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

    public UserDto Adapt(User model)
    {
        return new UserDto
        {
            Name = model.Name,
            EmailAddress = model.EmailAddress,
            GivenName = model.GivenName,
            Access = model.Access != null ? _accessAdapter.Adapt(model.Access) : null,
        };
    }

    public User Adapt(UserDto dto)
    {
        return new User
        {
            Name = dto.Name.Trim(),
            EmailAddress = dto.EmailAddress.Trim(),
            GivenName = dto.GivenName.Trim(),
            Access = dto.Access != null ? _accessAdapter.Adapt(dto.Access) : null,
        };
    }
}
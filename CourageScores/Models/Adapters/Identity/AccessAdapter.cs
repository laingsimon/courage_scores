using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class AccessAdapter : ISimpleAdapter<Access, AccessDto>
{
    public AccessDto Adapt(Access model)
    {
        return new AccessDto
        {
            GameAdmin = model.GameAdmin,
            LeagueAdmin = model.LeagueAdmin,
            TeamAdmin = model.TeamAdmin,
            UserAdmin = model.UserAdmin,
        };
    }

    public Access Adapt(AccessDto dto)
    {
        return new Access
        {
            GameAdmin = dto.GameAdmin,
            LeagueAdmin = dto.LeagueAdmin,
            TeamAdmin = dto.TeamAdmin,
            UserAdmin = dto.UserAdmin,
        };
    }
}
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

public interface IPermissionedEntity
{
    bool CanCreate(UserDto? user);
    bool CanEdit(UserDto? user);
    bool CanDelete(UserDto? user);
}
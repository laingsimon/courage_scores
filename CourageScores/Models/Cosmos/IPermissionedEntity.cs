using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos;

public interface IPermissionedEntity
{
    Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token);
    Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token);
    Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token);

    UserAccessContext GetUserAccessContext()
    {
        return UserAccessContext.None();
    }
}

using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Newtonsoft.Json;

namespace CourageScores.Models.Cosmos;

public class Photo : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// i.e. the id of the fixture
    /// </summary>
    public Guid EntityId { get; set; }

    /// <summary>
    /// the id of the team, if available
    /// </summary>
    public Guid? TeamId { get; set; }

    /// <summary>
    /// The contents of the photo
    /// The binary data is recorded in blob storage by the PhotoRepository
    /// </summary>
    [JsonIgnore]
    public byte[] PhotoBytes { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// The name of the file, if available
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// The type of the photo
    /// </summary>
    public string ContentType { get; set; } = null!;

    public Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return userAccess.HasAccess(AccessOption.UploadPhotos, token);
    }

    public Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return userAccess.HasAnyAccess([AccessOption.UploadPhotos, AccessOption.ViewAnyPhoto], token);
    }

    public Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return userAccess.HasAnyAccess([AccessOption.UploadPhotos, AccessOption.DeleteAnyPhoto], token);
    }

    public UserAccessContext GetUserAccessContext()
    {
        return TeamId != null
            ? UserAccessContext.ForTeam(null, null, TeamId.Value)
            : UserAccessContext.None();
    }
}

using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Services.Identity;

namespace CourageScores.Services;

public interface IPhotoService
{
    Task<ActionResult<PhotoReference>> Upsert(Photo photo, UserAccessContext context, CancellationToken token);
    Task<Photo?> GetPhoto(Guid id, CancellationToken token);
    Task<ActionResult<Photo>> Delete(Guid id, UserAccessContext context, CancellationToken token);
}

using CourageScores.Models;
using CourageScores.Models.Cosmos;

namespace CourageScores.Services;

public interface IPhotoService
{
    Task<ActionResult<PhotoReference>> Upsert(Photo photo, CancellationToken token);
    Task<Photo?> GetPhoto(Guid id, CancellationToken token);
    Task<ActionResult<Photo>> Delete(Guid id, CancellationToken token);
}
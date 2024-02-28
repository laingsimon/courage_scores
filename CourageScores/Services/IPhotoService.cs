using CourageScores.Models;
using CourageScores.Models.Cosmos;

namespace CourageScores.Services;

public interface IPhotoService
{
    Task<ActionResult<PhotoReference>> Upsert(Photo photo, CancellationToken token);
    Task<byte[]?> GetPhoto(Guid id, CancellationToken token);
}
using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public interface IPhotoRepository
{
    Task Upsert(Photo photo, CancellationToken token);
    Task<Photo?> GetPhoto(Guid id, CancellationToken token);
}
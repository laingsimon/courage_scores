using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public interface IPhotoRepository
{
    Task<Photo?> Get(Guid id, CancellationToken token);
    Task<Photo> Upsert(Photo item, CancellationToken token);
}
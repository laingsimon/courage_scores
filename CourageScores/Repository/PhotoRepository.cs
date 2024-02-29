using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public class PhotoRepository : IPhotoRepository
{
    private readonly IGenericRepository<Photo> _cosmosRepository;

    public PhotoRepository(IGenericRepository<Photo> cosmosRepository)
    {
        _cosmosRepository = cosmosRepository;
    }

    public Task<Photo?> Get(Guid id, CancellationToken token)
    {
        return _cosmosRepository.Get(id, token);
    }

    public Task<Photo> Upsert(Photo item, CancellationToken token)
    {
        return _cosmosRepository.Upsert(item, token);
    }

    // TODO: Add a delete method to delete the blob from storage
}
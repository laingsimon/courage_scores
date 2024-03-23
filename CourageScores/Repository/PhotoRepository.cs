using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public class PhotoRepository : IPhotoRepository
{
    private readonly IGenericRepository<Photo> _cosmosRepository;
    private readonly IBlobStorageRepository _blobStorageRepository;

    public PhotoRepository(IGenericRepository<Photo> cosmosRepository, IBlobStorageRepository blobStorageRepository)
    {
        _cosmosRepository = cosmosRepository;
        _blobStorageRepository = blobStorageRepository;
    }

    public async Task<Photo?> Get(Guid id, CancellationToken token)
    {
        var photo = await _cosmosRepository.Get(id, token);
        if (photo != null)
        {
            photo.PhotoBytes = (await _blobStorageRepository.Read(photo.Id.ToString(), token)) ?? Array.Empty<byte>();
        }

        return photo;
    }

    public async Task<Photo> Upsert(Photo item, CancellationToken token)
    {
        var photo = await _cosmosRepository.Upsert(item, token);
        if (item.Deleted != null)
        {
            await _blobStorageRepository.Delete(photo.Id.ToString(), token);
        }
        else
        {
            await _blobStorageRepository.Write(photo.Id.ToString(), item.PhotoBytes, token);
        }

        return photo;
    }
}
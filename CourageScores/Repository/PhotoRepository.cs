using System.Collections.Concurrent;
using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public class PhotoRepository : IPhotoRepository
{
    private static readonly ConcurrentDictionary<Guid, Photo> Store = new ConcurrentDictionary<Guid, Photo>();

    public Task Upsert(Photo photo, CancellationToken token)
    {
        Store.TryRemove(photo.Id, out _);
        Store.TryAdd(photo.Id, photo);
        return Task.CompletedTask;
    }

    public Task<Photo?> GetPhoto(Guid id, CancellationToken token)
    {
        return Task.FromResult(Store.GetValueOrDefault(id));
    }
}
using System.Collections.Concurrent;

namespace CourageScores.Repository;

public class PhotoRepository : IPhotoRepository
{
    private static readonly ConcurrentDictionary<Guid, byte[]> Store = new ConcurrentDictionary<Guid, byte[]>();

    public async Task Upsert(Guid id, byte[] bytes, CancellationToken token)
    {
        Store.TryRemove(id, out _);
        Store.TryAdd(id, bytes);
    }

    public async Task<byte[]?> GetPhoto(Guid id, CancellationToken token)
    {
        return Store.GetValueOrDefault(id);
    }
}
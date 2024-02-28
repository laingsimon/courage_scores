namespace CourageScores.Repository;

public interface IPhotoRepository
{
    Task Upsert(Guid id, byte[] bytes, CancellationToken token);
    Task<byte[]?> GetPhoto(Guid id, CancellationToken token);
}
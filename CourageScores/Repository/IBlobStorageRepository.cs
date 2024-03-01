namespace CourageScores.Repository;

public interface IBlobStorageRepository
{
    Task<byte[]?> Read(string path, CancellationToken token);
    Task Write(string path, byte[] contents, CancellationToken token);
    Task Delete(string path, CancellationToken token);
}
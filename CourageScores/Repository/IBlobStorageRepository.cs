namespace CourageScores.Repository;

public interface IBlobStorageRepository
{
    Task<byte[]?> Read(string container, string path, CancellationToken token);
    Task Write(string container, string path, byte[] contents, CancellationToken token);
    Task Delete(string container, string path, CancellationToken token);
}

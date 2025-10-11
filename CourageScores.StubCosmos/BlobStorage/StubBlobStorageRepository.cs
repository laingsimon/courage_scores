using System.Diagnostics.CodeAnalysis;
using CourageScores.Repository;
using CourageScores.StubCosmos.Api;

namespace CourageScores.StubCosmos.BlobStorage;

[ExcludeFromCodeCoverage]
internal class StubBlobStorageRepository : IBlobStorageRepository, IStubCosmosData
{
    private readonly Dictionary<string, byte[]?> _content = new();

    public Task<byte[]?> Read(string path, CancellationToken token)
    {
        return Task.FromResult(_content[path]);
    }

    public Task Write(string path, byte[] contents, CancellationToken token)
    {
        _content[path] = contents;
        return Task.CompletedTask;
    }

    public Task Delete(string path, CancellationToken token)
    {
        _content.Remove(path);
        return Task.CompletedTask;
    }

    public Task Clear()
    {
        _content.Clear();
        return Task.CompletedTask;
    }
}

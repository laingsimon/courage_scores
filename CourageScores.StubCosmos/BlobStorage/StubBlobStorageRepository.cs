using System.Diagnostics.CodeAnalysis;
using CourageScores.Repository;
using CourageScores.StubCosmos.Api;

namespace CourageScores.StubCosmos.BlobStorage;

[ExcludeFromCodeCoverage]
public class StubBlobStorageRepository : IBlobStorageRepository, IStubCosmosData, ISnapshottable
{
    private readonly Dictionary<string, Dictionary<string, byte[]>> _snapshots = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, byte[]> _content = new(StringComparer.OrdinalIgnoreCase);

    public Task<byte[]?> Read(string path, CancellationToken token)
    {
        return Task.FromResult<byte[]?>(_content[path]);
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
        _snapshots.Clear();
        return Task.CompletedTask;
    }

    public Task CreateSnapshot(string name)
    {
        if (!_snapshots.TryGetValue(name, out var snapshot))
        {
            snapshot = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
            _snapshots[name] = snapshot;
        }

        snapshot.Clear();
        foreach (var data in _content)
        {
            snapshot[data.Key] = data.Value;
        }

        return Task.CompletedTask;
    }

    public Task ResetToSnapshot(string name)
    {
        if (!_snapshots.TryGetValue(name, out var snapshot))
        {
            throw new ArgumentOutOfRangeException(nameof(name), name, "Unable to find snapshot with given name");
        }

        _content.Clear();
        foreach (var data in snapshot)
        {
            _content[data.Key] = data.Value;
        }

        return Task.CompletedTask;
    }

    public Task DeleteSnapshot(string name)
    {
        _snapshots.Remove(name);
        return Task.CompletedTask;
    }
}

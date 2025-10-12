using System.Diagnostics.CodeAnalysis;
using CourageScores.Common.Cosmos;
using Microsoft.Azure.Cosmos;

namespace CourageScores.StubCosmos.Api;

internal class StubCosmosDatabase : UnimplementedCosmosDatabase, IStubCosmosData, ISnapshottable
{
    private readonly Dictionary<string, Dictionary<string, StubContainer>> _snapshots = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, StubContainer> _containers = new(StringComparer.OrdinalIgnoreCase);

    public override Task<ContainerResponse> CreateContainerIfNotExistsAsync(
        string id,
        string partitionKeyPath,
        int? throughput = null,
        RequestOptions? requestOptions = null,
        CancellationToken cancellationToken = default)
    {
        if (!_containers.TryGetValue(id, out _))
        {
            _containers.Add(id, new StubContainer(id, partitionKeyPath));
        }

        return Task.FromResult<ContainerResponse>(new StubContainerResponse(_containers[id]));
    }

    public override FeedIterator GetContainerQueryStreamIterator(
        string? queryText = null,
        string? continuationToken = null,
        QueryRequestOptions? requestOptions = null)
    {
        if (!string.IsNullOrEmpty(queryText))
        {
            throw new NotSupportedException("Querying items in the database using a query isn't supported.");
        }

        return new StubFeedIterator<ContainerItemJson>(
                new ContainerItemJson
                {
                    DocumentCollections = _containers.Values.Select(c => c.ToContainerItemJson()).ToList(),
                })
            .NotGeneric();
    }

    [ExcludeFromCodeCoverage]
    public Task Clear()
    {
        _containers.Clear();
        _snapshots.Clear();
        return Task.CompletedTask;
    }

    [ExcludeFromCodeCoverage]
    public override Container GetContainer(string id)
    {
        return _containers[id];
    }

    [ExcludeFromCodeCoverage]
    private class StubContainerResponse(Container container) : ContainerResponse
    {
        public override Container Container => container;
    }

    public Task CreateSnapshot(string name)
    {
        if (!_snapshots.TryGetValue(name, out var snapshot))
        {
            snapshot = new Dictionary<string, StubContainer>(StringComparer.OrdinalIgnoreCase);
            _snapshots[name] = snapshot;
        }

        snapshot.Clear();
        foreach (var container in _containers)
        {
            snapshot[container.Key] = container.Value.Clone();
        }

        return Task.CompletedTask;
    }

    public Task ResetToSnapshot(string name)
    {
        if (!_snapshots.TryGetValue(name, out var snapshot))
        {
            throw new ArgumentOutOfRangeException(nameof(name), name, "Unable to find snapshot with given name");
        }

        _containers.Clear();
        foreach (var container in snapshot)
        {
            _containers[container.Key] = container.Value.Clone();
        }

        return Task.CompletedTask;
    }

    public Task DeleteSnapshot(string name)
    {
        _snapshots.Remove(name);
        return Task.CompletedTask;
    }
}

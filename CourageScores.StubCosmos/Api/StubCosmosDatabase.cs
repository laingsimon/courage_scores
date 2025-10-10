using System.Diagnostics.CodeAnalysis;
using CourageScores.Common.Cosmos;
using Microsoft.Azure.Cosmos;

namespace CourageScores.StubCosmos.Api;

internal class StubCosmosDatabase : UnimplementedCosmosDatabase, IStubCosmosData
{
    private readonly Dictionary<string, StubContainer> _containers = new();

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
}

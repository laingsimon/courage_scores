using CourageScores.Services.Data;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Sandbox.Cosmos.Api;

internal class TestCosmosDatabase : UnimplementedCosmosDatabase, IClearable
{
    private readonly Dictionary<string, TestContainer> _containers = new();

    public override Task<ContainerResponse> CreateContainerIfNotExistsAsync(
        string id,
        string partitionKeyPath,
        int? throughput = null,
        RequestOptions? requestOptions = null,
        CancellationToken cancellationToken = default)
    {
        if (!_containers.TryGetValue(id, out _))
        {
            _containers.Add(id, new TestContainer(id, partitionKeyPath));
        }

        return Task.FromResult<ContainerResponse>(new TestContainerResponse(_containers[id]));
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

        return new MockFeedIterator<ContainerItemJson>(
                new ContainerItemJson
                {
                    DocumentCollections = _containers.Values.Select(c => c.ToContainerItemJson()).ToList(),
                })
            .NotGeneric();
    }

    public Task Clear()
    {
        _containers.Clear();
        return Task.CompletedTask;
    }

    public override Container GetContainer(string id)
    {
        return _containers[id];
    }

    private class TestContainerResponse(Container container) : ContainerResponse
    {
        public override Container Container => container;
    }
}

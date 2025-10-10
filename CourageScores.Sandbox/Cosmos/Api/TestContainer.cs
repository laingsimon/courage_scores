using System.Reflection;
using CourageScores.Sandbox.Cosmos.Query.Parser;
using CourageScores.Services.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;

namespace CourageScores.Sandbox.Cosmos.Api;

internal class TestContainer(string id, string configuredKeyPath) : UnimplementedContainer(id), IClearable
{
    private static readonly CosmosQueryParser QueryParser = new CosmosQueryParser();
    internal readonly Dictionary<string, object> Data = new(StringComparer.OrdinalIgnoreCase);

    public override FeedIterator<T> GetItemQueryIterator<T>(
        string? queryText = null,
        string? continuationToken = null,
        QueryRequestOptions? requestOptions = null)
    {
        var query = string.IsNullOrEmpty(queryText)
            ? null
            : QueryParser.Parse<T>(queryText);

        if (query != null && query.From.Name != base.Id)
        {
            throw new NotSupportedException(
                $"Unable to run query for a different container, current container: {base.Id}, query: {queryText}");
        }

        var values = Data.Values.OfType<T>();
        return new MockFeedIterator<T>(values.Where(row => query?.Where?.All(f => f.Matches(row)) != false).Select(Clone).ToArray());
    }

    public override Task<ItemResponse<T>> UpsertItemAsync<T>(
        T item,
        PartitionKey? partitionKey = null,
        ItemRequestOptions? requestOptions = null,
        CancellationToken cancellationToken = default)
    {
        var propertyName = configuredKeyPath.TrimStart('/');
        var property = item.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        var key = property!.GetValue(item)!.ToString()!;

        Data[key] = item;
        return Task.FromResult<ItemResponse<T>>(new MockItemResponse<T>());
    }

    public Task Clear()
    {
        Data.Clear();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Clone the row so the data help in the container cannot be modified directly
    /// </summary>
    private static T Clone<T>(T row)
    {
        return JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(row))!;
    }

    public ContainerItemJson.DocumentCollection ToContainerItemJson()
    {
        return new ContainerItemJson.DocumentCollection
        {
            Id = Id,
            PartitionKey = new ContainerItemJson.PartitionKeyPaths
            {
                Paths = [configuredKeyPath]
            },
        };
    }
}

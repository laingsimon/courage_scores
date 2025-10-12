using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using CourageScores.Common.Cosmos;
using CourageScores.StubCosmos.Query.Parser;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;

namespace CourageScores.StubCosmos.Api;

internal class StubContainer(string id, string configuredKeyPath) : UnimplementedContainer(id), IStubCosmosData
{
    private static readonly CosmosQueryParser QueryParser = new();

    private readonly Dictionary<string, object> _data = new(StringComparer.OrdinalIgnoreCase);

    public override FeedIterator<T> GetItemQueryIterator<T>(
        string? queryText = null,
        string? continuationToken = null,
        QueryRequestOptions? requestOptions = null)
    {
        var query = string.IsNullOrWhiteSpace(queryText)
            ? null
            : QueryParser.Parse<T>(queryText.Replace("\r", ""));

        if (query != null && query.From.Name != base.Id)
        {
            throw new InvalidOperationException(
                $"Unable to run query for a different container, current container: {base.Id}, query: {queryText}");
        }

        var values = _data.Values.OfType<T>();
        return new StubFeedIterator<T>(values.Where(row => query?.Where?.All(f => f.Matches(row)) != false).Select(Clone).ToArray());
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

        _data[key] = item;
        return Task.FromResult<ItemResponse<T>>(new StubItemResponse<T>());
    }

    [ExcludeFromCodeCoverage]
    public Task Clear()
    {
        _data.Clear();
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

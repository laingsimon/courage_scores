using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using CourageScores.Common.Cosmos;
using CourageScores.StubCosmos.Query.Parser;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;

namespace CourageScores.StubCosmos.Api;

internal class StubContainer(string id, string configuredKeyPath) : UnimplementedContainer(id), IStubCosmosData, ISnapshottable
{
    private static readonly CosmosQueryParser QueryParser = new();

    private readonly string _containerId = id;
    private readonly ConcurrentDictionary<string, Dictionary<string, object>> _snapshots = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, object> _data = new(StringComparer.OrdinalIgnoreCase);

    private StubContainer(string id, string configuredKeyPath, ConcurrentDictionary<string, object> data, ConcurrentDictionary<string, Dictionary<string, object>> snapshots)
        :this(id, configuredKeyPath)
    {
        _data = data;
        _snapshots = snapshots;
    }

    public override FeedIterator<T> GetItemQueryIterator<T>(
        string? queryText = null,
        string? continuationToken = null,
        QueryRequestOptions? requestOptions = null)
    {
        try
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
            return new StubFeedIterator<T>(values.Where(row => query?.Where?.All(f => f.Matches(row)) != false)
                .Select(CloneRow).ToArray());
        }
        catch (QueryParserException exc)
        {
            throw new InvalidOperationException($"Unable to run query: '{queryText}'\n\n{exc.Message}", exc);
        }
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
        _snapshots.Clear();
        return Task.CompletedTask;
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

    public Task CreateSnapshot(string name)
    {
        if (!_snapshots.TryGetValue(name, out var snapshot))
        {
            snapshot = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            _snapshots[name] = snapshot;
        }

        snapshot.Clear();
        foreach (var data in _data)
        {
            snapshot[data.Key] = CloneRow(data.Value);
        }

        return Task.CompletedTask;
    }

    public Task ResetToSnapshot(string name)
    {
        if (!_snapshots.TryGetValue(name, out var snapshot))
        {
            throw new ArgumentOutOfRangeException(nameof(name), name, "Unable to find snapshot with given name");
        }

        _data.Clear();
        foreach (var data in snapshot)
        {
            _data[data.Key] = CloneRow(data.Value);
        }

        return Task.CompletedTask;
    }

    public Task DeleteSnapshot(string name)
    {
        _snapshots.TryRemove(name, out _);
        return Task.CompletedTask;
    }

    public StubContainer Clone()
    {
        return new StubContainer(
            _containerId,
            configuredKeyPath,
            new ConcurrentDictionary<string, object>(_data.ToDictionary(pair => pair.Key, pair => CloneRow(pair.Value))),
            new ConcurrentDictionary<string, Dictionary<string, object>>(_snapshots.ToDictionary(pair => pair.Key, pair => pair.Value.ToDictionary(p => p.Key, p => CloneRow(p.Value)))));
    }

    /// <summary>
    /// Clone the row so the data help in the container cannot be modified directly
    /// </summary>
    private static T CloneRow<T>(T row)
    {
        return JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(row))!;
    }
}

using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

[ExcludeFromCodeCoverage]
public abstract class CosmosDbRepository<T> where T : CosmosEntity
{
    private readonly Lazy<Container> _container;
    protected readonly string TableName;

    protected CosmosDbRepository(Database database)
    {
        TableName = typeof(T).Name.ToLower();
        _container = new Lazy<Container>(() => database.CreateContainerIfNotExistsAsync(TableName, "/id").Result);
    }

    protected async Task UpsertItem(T item, CancellationToken token)
    {
        await _container.Value.UpsertItemAsync(item, new PartitionKey(item.Id.ToString()), cancellationToken: token);
    }

    protected async Task DeleteItem(Guid id, CancellationToken token)
    {
        var partitionKey = new PartitionKey(id.ToString());
        await _container.Value.DeleteItemAsync<T>(id.ToString(), partitionKey, cancellationToken: token);
    }

    protected async IAsyncEnumerable<T> Query(string? query, [EnumeratorCancellation] CancellationToken token)
    {
        var iterator = _container.Value.GetItemQueryIterator<T>(query);
        while (iterator.HasMoreResults && !token.IsCancellationRequested)
        {
            var nextResult = await iterator.ReadNextAsync(token);
            foreach (var item in nextResult)
            {
                if (token.IsCancellationRequested)
                {
                    yield break;
                }

                yield return item;
            }
        }
    }

    protected async Task<T?> GetItem(Guid id, CancellationToken token)
    {
        await foreach (var item in Query($"select * from {TableName} t where t.id = '{id}'", token))
        {
            return item;
        }

        return default;
    }
}
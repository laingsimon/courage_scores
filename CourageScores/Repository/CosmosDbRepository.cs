using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public abstract class CosmosDbRepository<T> where T : CosmosEntity
{
    private readonly Container _container;
    private readonly string _tableName;

    protected CosmosDbRepository(Database database)
    {
        _tableName = typeof(T).Name.ToLower();
        _container = database.CreateContainerIfNotExistsAsync(_tableName, "/id").Result;
    }

    protected async Task DeleteItem(Guid id, CancellationToken token)
    {
        await _container.DeleteItemAsync<T>(id.ToString(), new PartitionKey(id.ToString()), cancellationToken: token);
    }

    protected async Task UpsertItem(T item, CancellationToken token)
    {
        await _container.UpsertItemAsync(item, new PartitionKey(item.Id.ToString()), cancellationToken: token);
    }

    protected async IAsyncEnumerable<T> Query(string? query, [EnumeratorCancellation] CancellationToken token)
    {
        var iterator = _container.GetItemQueryIterator<T>(query);
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
        await foreach (var item in Query($"select * from {_tableName} t where t.id = '{id}'", token))
        {
            return item;
        }

        return default;
    }
}
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public class DataBrowserRepository<T> : IDataBrowserRepository<T>
{
    private readonly Database _database;
    private readonly ICosmosTableNameResolver _tableNameResolver;

    public DataBrowserRepository(Database database, ICosmosTableNameResolver tableNameResolver)
    {
        _database = database;
        _tableNameResolver = tableNameResolver;
    }

    [ExcludeFromCodeCoverage]
    public async IAsyncEnumerable<T> GetAll(string tableName, [EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var item in Query(tableName, "", token))
        {
            yield return item;
        }
    }

    [ExcludeFromCodeCoverage]
    public async Task<T?> GetItem(string tableName, Guid id, CancellationToken token)
    {
        await foreach (var item in Query(tableName, $"where t.id = '{id}'", token))
        {
            return item;
        }

        return default;
    }

    public Task<bool> TableExists(string tableName)
    {
        var actualTableName = _tableNameResolver.GetTableName(tableName);
        var container = _database.GetContainer(actualTableName);
        return Task.FromResult(container != null);
    }

    [ExcludeFromCodeCoverage]
    private async IAsyncEnumerable<T> Query(string tableName, string? whereClause, [EnumeratorCancellation] CancellationToken token)
    {
        var actualTableName = _tableNameResolver.GetTableName(tableName);
        Container container = await _database.CreateContainerIfNotExistsAsync(actualTableName, "/id", cancellationToken: token);

        var iterator = container.GetItemQueryIterator<T>($"select * from {_tableNameResolver.GetTableName(tableName)} t {whereClause}");
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
}
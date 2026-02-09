using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

[ExcludeFromCodeCoverage]
public class DataBrowserRepository<T> : IDataBrowserRepository<T>
{
    private readonly Database _database;

    public DataBrowserRepository(Database database)
    {
        _database = database;
    }

    public async IAsyncEnumerable<T> GetAll(string tableName, [EnumeratorCancellation] CancellationToken token)
    {
        tableName = tableName.Trim().ToLower();

        if (!await TableExists(tableName, token))
        {
            throw new ArgumentOutOfRangeException(nameof(tableName), tableName, "Table not found");
        }

        await foreach (var item in Query(tableName, "", token))
        {
            yield return item;
        }
    }

    public async Task<T?> GetItem(string tableName, Guid id, CancellationToken token)
    {
        tableName = tableName.Trim().ToLower();

        if (!await TableExists(tableName, token))
        {
            throw new ArgumentOutOfRangeException(nameof(tableName), tableName, "Table not found");
        }

        await foreach (var item in Query(tableName, $"where t.id = '{id}'", token))
        {
            return item;
        }

        return default;
    }

    public async Task<bool> TableExists(string tableName, CancellationToken token)
    {
        var iterator = _database.GetContainerQueryIterator<ContainerProperties>();
        while (iterator.HasMoreResults && !token.IsCancellationRequested)
        {
            var response = await iterator.ReadNextAsync(token);
            foreach (var container in response)
            {
                if (container.Id.Equals(tableName, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private async IAsyncEnumerable<T> Query(string tableName, string? whereClause, [EnumeratorCancellation] CancellationToken token)
    {
        var container = _database.GetContainer(tableName);
        var iterator = container.GetItemQueryIterator<T>($"select * from {tableName} t {whereClause}");
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

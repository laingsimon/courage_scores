using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

[ExcludeFromCodeCoverage]
public class GenericRepository<T> : CosmosDbRepository<T>, IGenericRepository<T>, IPermanentDeleteRepository<T>
    where T : CosmosEntity
{
    public GenericRepository(Database database, ICosmosTableNameResolver tableNameResolver)
        : base(database, tableNameResolver)
    {
    }

    public async Task<T?> Get(Guid id, CancellationToken token)
    {
        return await GetItem(id, token);
    }

    public IAsyncEnumerable<T> GetAll(CancellationToken token)
    {
        return Query($"select * from {TableName} t where t.{nameof(AuditedEntity.Deleted)} = null", token);
    }

    public IAsyncEnumerable<T> GetSome(string where, CancellationToken token)
    {
        return Query($"select * from {TableName} t where ({where}) and t.{nameof(AuditedEntity.Deleted)} = null", token);
    }

    public async Task<T> Upsert(T item, CancellationToken token)
    {
        await UpsertItem(item, token);
        return await Get(item.Id, token) ?? throw new InvalidOperationException($"{typeof(T).Name} does not exist");
    }

    public async Task Delete(Guid id, CancellationToken token)
    {
        await DeleteItem(id, token);
    }
}
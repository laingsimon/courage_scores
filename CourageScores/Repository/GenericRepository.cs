using Microsoft.Azure.Cosmos;
using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public class GenericRepository<T> : CosmosDbRepository<T>, IGenericRepository<T>
    where T : CosmosEntity
{
    public GenericRepository(Database database)
        :base(database)
    { }

    public async Task<T?> Get(Guid id, CancellationToken token)
    {
        return await GetItem(id, token);
    }

    public IAsyncEnumerable<T> GetAll(CancellationToken token)
    {
        return Query($"select * from {_tableName} t where {nameof(AuditedEntity.Deleted)} is null", token);
    }

    public IAsyncEnumerable<T> GetSome(string where, CancellationToken token)
    {
        return Query($"select * from {_tableName} t where ({where}) and {nameof(AuditedEntity.Deleted)} is null", token);
    }

    public async Task<T> Upsert(T item, CancellationToken token)
    {
        await UpsertItem(item, token);
        return await Get(item.Id, token) ?? throw new InvalidOperationException($"{typeof(T).Name} does not exist");
    }
}

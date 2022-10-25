using Microsoft.Azure.Cosmos;
using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public interface IGenericRepository<T>
    where T : CosmosEntity
{
    Task<T?> Get(Guid id, CancellationToken token);
    IAsyncEnumerable<T> GetAll(CancellationToken token);
    IAsyncEnumerable<T> GetSome(string where, CancellationToken token);
    Task<T> UpsertTeam(T item, CancellationToken token);
}

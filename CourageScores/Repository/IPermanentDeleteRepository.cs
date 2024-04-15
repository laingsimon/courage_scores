using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public interface IPermanentDeleteRepository<T>
    where T : CosmosEntity
{
    Task Delete(Guid id, CancellationToken token);
}
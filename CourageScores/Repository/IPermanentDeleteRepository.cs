using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

// T isn't required here, as it isn't used in/out of the methods below.
// However we want to ensure that this repository type is tied to the data type it represents, hence keeping it
public interface IPermanentDeleteRepository<T>
    where T : CosmosEntity
{
    Task Delete(Guid id, CancellationToken token);
}

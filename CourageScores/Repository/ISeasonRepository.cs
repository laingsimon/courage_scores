using CourageScores.Models.Cosmos;

namespace CourageScores.Repository;

public interface ISeasonRepository
{
    Task<Season?> Get(Guid id, CancellationToken token);
    IAsyncEnumerable<Season> GetAll(CancellationToken token);
}
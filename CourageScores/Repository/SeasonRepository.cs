using CourageScores.Models.Cosmos;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public class SeasonRepository : CosmosDbRepository<Season>, ISeasonRepository
{
    public SeasonRepository(Database database)
        :base(database)
    { }

    public async Task<Season?> Get(Guid id, CancellationToken token)
    {
        return await GetItem(id, token);
    }

    public IAsyncEnumerable<Season> GetAll(CancellationToken token)
    {
        return Query(null, token);
    }
}
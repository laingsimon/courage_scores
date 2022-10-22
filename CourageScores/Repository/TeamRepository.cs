using CourageScores.Models.Dtos.Team;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public class TeamRepository : CosmosDbRepository<TeamDto>, ITeamRepository
{
    public TeamRepository(Database database)
        :base(database)
    { }

    public async Task<TeamDto?> Get(Guid id, CancellationToken token)
    {
        return await GetItem(id, token);
    }

    public IAsyncEnumerable<TeamDto> GetAll(CancellationToken token)
    {
        return Query(null, token);
    }

    public IAsyncEnumerable<TeamDto> GetSome(string where, CancellationToken token)
    {
        return Query($"select * from teamdto t {where}", token);
    }
}
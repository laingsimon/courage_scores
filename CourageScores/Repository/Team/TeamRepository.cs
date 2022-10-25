using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository.Team;

public class TeamRepository : CosmosDbRepository<Models.Cosmos.Team.Team>, ITeamRepository
{
    public TeamRepository(Database database)
        :base(database)
    { }

    public async Task<Models.Cosmos.Team.Team?> Get(Guid id, CancellationToken token)
    {
        return await GetItem(id, token);
    }

    public IAsyncEnumerable<Models.Cosmos.Team.Team> GetAll(CancellationToken token)
    {
        return Query(null, token);
    }

    public IAsyncEnumerable<Models.Cosmos.Team.Team> GetSome(string where, CancellationToken token)
    {
        return Query($"select * from teamdto t {where}", token);
    }

    public async Task<Models.Cosmos.Team.Team> UpsertTeam(Models.Cosmos.Team.Team team, CancellationToken token)
    {
        await UpsertItem(team, token);
        return await Get(team.Id, token) ?? throw new InvalidOperationException("Team does not exist");
    }

    public async Task DeleteTeam(Guid id, CancellationToken token)
    {
        await DeleteItem(id, token);
    }
}
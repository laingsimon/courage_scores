using CourageScores.Models.Cosmos.Team;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public class TeamRepository : CosmosDbRepository<Team>, ITeamRepository
{
    public TeamRepository(Database database)
        :base(database)
    { }

    public async Task<Team?> Get(Guid id, CancellationToken token)
    {
        return await GetItem(id, token);
    }

    public IAsyncEnumerable<Team> GetAll(CancellationToken token)
    {
        return Query(null, token);
    }

    public IAsyncEnumerable<Team> GetSome(string where, CancellationToken token)
    {
        return Query($"select * from teamdto t {where}", token);
    }

    public async Task<Team> UpsertTeam(Team team, CancellationToken token)
    {
        await UpsertItem(team, token);
        return await Get(team.Id, token) ?? throw new InvalidOperationException("Team does not exist");
    }

    public async Task DeleteTeam(Guid id, CancellationToken token)
    {
        await DeleteItem(id, token);
    }
}
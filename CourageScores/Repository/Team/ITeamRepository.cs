namespace CourageScores.Repository.Team;

public interface ITeamRepository
{
    Task<Models.Cosmos.Team.Team?> Get(Guid id, CancellationToken token);
    IAsyncEnumerable<Models.Cosmos.Team.Team> GetAll(CancellationToken token);
    IAsyncEnumerable<Models.Cosmos.Team.Team> GetSome(string where, CancellationToken token);
    Task<Models.Cosmos.Team.Team> UpsertTeam(Models.Cosmos.Team.Team team, CancellationToken token);
    Task DeleteTeam(Guid id, CancellationToken token);
}
using CourageScores.Models.Cosmos.Team;

namespace CourageScores.Repository;

public interface ITeamRepository
{
    Task<Team?> Get(Guid id, CancellationToken token);
    IAsyncEnumerable<Team> GetAll(CancellationToken token);
    IAsyncEnumerable<Team> GetSome(string where, CancellationToken token);
}
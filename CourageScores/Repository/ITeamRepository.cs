using CourageScores.Models.Dtos.Team;

namespace CourageScores.Repository;

public interface ITeamRepository
{
    Task<TeamDto?> Get(Guid id, CancellationToken token);
    IAsyncEnumerable<TeamDto> GetAll(CancellationToken token);
    IAsyncEnumerable<TeamDto> GetSome(string where, CancellationToken token);
}
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Repository;

public interface ITeamRepository
{
    Task<TeamDto> Get(Guid id);
    IAsyncEnumerable<TeamDto> GetAll();
}
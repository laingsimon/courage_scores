using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Team;

public interface ITeamService
{
    Task<TeamDto?> GetTeam(Guid id, CancellationToken token);
    IAsyncEnumerable<TeamDto> GetAllTeams(CancellationToken token);
    Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token);
    Task<ActionResultDto<TeamDto>> UpdateTeam<TOut>(Guid id, IUpdateCommand<Models.Cosmos.Team.Team, TOut> updateCommand, CancellationToken token);
}
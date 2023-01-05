using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services;

public interface ITeamService : IGenericDataService<Team, TeamDto>
{
    IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid seasonId, CancellationToken token);
    IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid divisionId, Guid seasonId, CancellationToken token);
}
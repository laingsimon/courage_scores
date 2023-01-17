using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Team;

public interface ITeamService : IGenericDataService<Models.Cosmos.Team.Team, TeamDto>
{
    IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid seasonId, CancellationToken token);
    IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid divisionId, Guid seasonId, CancellationToken token);
}
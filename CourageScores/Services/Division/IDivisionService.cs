using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Services.Division;

public interface IDivisionService : IGenericDataService<Models.Cosmos.Division, DivisionDto>
{
    IAsyncEnumerable<DivisionTeamDto> GetTeams(Guid divisionId, CancellationToken token);
    IAsyncEnumerable<DivisionFixtureDto> GetFixtures(Guid divisionId, CancellationToken token);
    IAsyncEnumerable<DivisionPlayerDto> GetPlayers(Guid divisionId, CancellationToken token);
}
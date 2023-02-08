using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionTeamAdapter
{
    Task<DivisionTeamDto> Adapt(TeamDto team, DivisionData.TeamScore score, CancellationToken token);
    Task<DivisionTeamDto> WithoutFixtures(TeamDto team, CancellationToken token);
}
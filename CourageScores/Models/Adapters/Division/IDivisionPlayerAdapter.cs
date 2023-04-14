using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionPlayerAdapter
{
    Task<DivisionPlayerDto> Adapt(DivisionData.PlayerScore score,
        DivisionData.TeamPlayerTuple playerTuple,
        Dictionary<DateTime, Guid> fixtures,
        CancellationToken token);

    Task<DivisionPlayerDto> Adapt(TeamDto team, TeamPlayerDto player, CancellationToken token);
}
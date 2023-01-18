using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionPlayerAdapter
{
    Task<DivisionPlayerDto> Adapt(Guid id, DivisionData.Score score, DivisionData.TeamPlayerTuple playerTuple, Dictionary<DateTime, Guid> fixtures);
}
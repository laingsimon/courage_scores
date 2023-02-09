using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public interface IPlayerPerformanceAdapter
{
    Task<PlayerPerformanceDto> Adapt(DivisionData.PlayerPlayScore score, CancellationToken token);
}
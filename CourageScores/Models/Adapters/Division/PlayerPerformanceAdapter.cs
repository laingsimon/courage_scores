using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public class PlayerPerformanceAdapter : IPlayerPerformanceAdapter
{
    public Task<PlayerPerformanceDto> Adapt(DivisionData.PlayerPlayScore score, CancellationToken token)
    {
        return Task.FromResult(new PlayerPerformanceDto
        {
            MatchesPlayed = score.MatchesPlayed,
            MatchesWon = score.MatchesWon,
            MatchesLost = score.MatchesLost,
            WinRate = score.PlayerWinRate,
            LossRate = score.PlayerLossRate,
            TeamWinRate = score.TeamWinRate,
            TeamLossRate = score.TeamLossRate,
        });
    }
}
using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public class DivisionPlayerAdapter : IDivisionPlayerAdapter
{
    public Task<DivisionPlayerDto> Adapt(DivisionData.PlayerScore score, DivisionData.TeamPlayerTuple playerTuple,
        Dictionary<DateTime, Guid> fixtures, CancellationToken token)
    {
        return Task.FromResult(new DivisionPlayerDto
        {
            Captain = playerTuple.Player.Captain,
            Id = playerTuple.Player.Id,
            Name = playerTuple.Player.Name,
            PlayedSingles = score.GetScores(1).Played,
            WonSingles = score.GetScores(1).Win,
            LostSingles = score.GetScores(1).Lost,
            PlayedPairs = score.GetScores(2).Played,
            WonTriples = score.GetScores(3).Win,
            PlayedTriples = score.GetScores(3).Played,
            WonPairs = score.GetScores(2).Win,
            WinDifference = score.GetScores(1).WinDifference + score.GetScores(2).WinDifference + score.GetScores(3).WinDifference,
            Points = score.CalculatePoints(),
            Team = playerTuple.Team.Name,
            OneEighties = score.OneEighty,
            Over100Checkouts = score.HiCheckout,
            TeamId = playerTuple.Team.Id,
            WinPercentage = score.PlayerWinPercentage,
            Fixtures = fixtures,
        });
    }
}
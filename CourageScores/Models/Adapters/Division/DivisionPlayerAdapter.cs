using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public class DivisionPlayerAdapter : IDivisionPlayerAdapter
{
    public Task<DivisionPlayerDto> Adapt(DivisionData.Score score, DivisionData.TeamPlayerTuple playerTuple,
        Dictionary<DateTime, Guid> fixtures, CancellationToken token)
    {
        return Task.FromResult(new DivisionPlayerDto
        {
            Captain = playerTuple.Player.Captain,
            Id = playerTuple.Player.Id,
            Lost = score.Lost,
            Name = playerTuple.Player.Name,
            PlayedSingles = score.GetPlayedCount(1),
            PlayedPairs = score.GetPlayedCount(2),
            PlayedTriples = score.GetPlayedCount(3),
            Points = score.CalculatePoints(),
            Team = playerTuple.Team.Name,
            Won = score.Win,
            OneEighties = score.OneEighty,
            Over100Checkouts = score.HiCheckout,
            TeamId = playerTuple.Team.Id,
            WinPercentage = score.PlayerWinPercentage,
            Fixtures = fixtures,
        });
    }
}
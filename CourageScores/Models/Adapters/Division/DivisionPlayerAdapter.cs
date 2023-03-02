using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public class DivisionPlayerAdapter : IDivisionPlayerAdapter
{
    private readonly IPlayerPerformanceAdapter _performanceAdapter;

    public DivisionPlayerAdapter(IPlayerPerformanceAdapter performanceAdapter)
    {
        _performanceAdapter = performanceAdapter;
    }

    public async Task<DivisionPlayerDto> Adapt(DivisionData.PlayerScore score, DivisionData.TeamPlayerTuple playerTuple,
        Dictionary<DateTime, Guid> fixtures, CancellationToken token)
    {
        return new DivisionPlayerDto
        {
            Captain = playerTuple.Player.Captain,
            Id = playerTuple.Player.Id,
            Name = playerTuple.Player.Name,
            Singles = await _performanceAdapter.Adapt(score.GetScores(1), token),
            Pairs = await _performanceAdapter.Adapt(score.GetScores(2), token),
            Triples = await _performanceAdapter.Adapt(score.GetScores(3), token),
            Points = score.GetScores(1).PlayerWinRate,
            Team = playerTuple.Team.Name,
            OneEighties = score.OneEighties,
            Over100Checkouts = score.HiCheckout,
            TeamId = playerTuple.Team.Id,
            WinPercentage = score.PlayerWinPercentage,
            Fixtures = fixtures,
        };
    }
}
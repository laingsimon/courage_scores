using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
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
            Name = playerTuple.Player.Name.Trim(),
            Singles = await _performanceAdapter.Adapt(score.GetScores(1), token),
            Pairs = await _performanceAdapter.Adapt(score.GetScores(2), token),
            Triples = await _performanceAdapter.Adapt(score.GetScores(3), token),
            Points = score.GetScores(1).PlayerWinRate,
            Team = playerTuple.Team.Name.Trim(),
            OneEighties = score.OneEighties,
            Over100Checkouts = score.HiCheckout,
            TeamId = playerTuple.Team.Id,
            WinPercentage = score.PlayerWinPercentage,
            Fixtures = fixtures,
            Updated = playerTuple.Player.Updated,
        };
    }

    public Task<DivisionPlayerDto> Adapt(TeamDto team, TeamPlayerDto player, CancellationToken token)
    {
        return Task.FromResult(new DivisionPlayerDto
        {
            Captain = player.Captain,
            Id = player.Id,
            Name = player.Name.Trim(),
            OneEighties = 0,
            Fixtures = new Dictionary<DateTime, Guid>(),
            Pairs = new PlayerPerformanceDto(),
            Points = 0,
            TeamId = team.Id,
            WinPercentage = 0,
            Singles = new PlayerPerformanceDto(),
            Over100Checkouts = 0,
            Team = team.Name.Trim(),
            Triples = new PlayerPerformanceDto(),
            Rank = -1,
            Updated = player.Updated,
        });
    }
}
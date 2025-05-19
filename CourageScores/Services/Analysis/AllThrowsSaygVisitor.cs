using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public abstract class AllThrowsSaygVisitor : ISaygVisitor
{
    private readonly string _breakdownName;
    private readonly IDictionary<string, List<int>> _allThrowsPerTeam = new Dictionary<string, List<int>>();

    protected AllThrowsSaygVisitor(string breakdownName)
    {
        _breakdownName = breakdownName;
    }

    public Task VisitThrow(SaygTeamPlayer player, int index, LegThrowDto thr, CancellationToken token)
    {
        if (!_allThrowsPerTeam.TryGetValue(player.TeamName ?? player.PlayerName, out var throws))
        {
            throws = new List<int>();
            _allThrowsPerTeam[player.TeamName ?? player.PlayerName] = throws;
        }

        throws.Add(thr.Score);
        return Task.CompletedTask;
    }

    public void Finished(AnalysisResponseDto response)
    {
        response[_breakdownName] = new BreakdownDto<NumericBreakdownDto>(_allThrowsPerTeam.ToDictionary(
            pair => pair.Key,
            pair =>
            {
                return GetPerTeamBreakdown(pair.Value);
            }));
    }

    protected abstract NumericBreakdownDto[] GetPerTeamBreakdown(IReadOnlyCollection<int> throws);
}
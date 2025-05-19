using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public class MostFrequentThrowsVisitor : ISaygVisitor
{
    private readonly int _maxCount;
    private readonly IDictionary<string, List<int>> _allThrowsPerTeam = new Dictionary<string, List<int>>();

    public MostFrequentThrowsVisitor(int maxCount = 10)
    {
        _maxCount = maxCount;
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
        response["MostFrequentThrows"] = new BreakdownDto<NumericBreakdownDto>(_allThrowsPerTeam.ToDictionary(
            pair => pair.Key,
            pair =>
            {
                return pair.Value
                    .GroupBy(thr => thr)
                    .OrderByDescending(gr => gr.Count())
                    .Select(gr => new NumericBreakdownDto(gr.Key, gr.Count()))
                    .Take(_maxCount)
                    .ToArray();
            }));
    }
}
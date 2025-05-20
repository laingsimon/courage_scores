using CourageScores.Models.Dtos.Analysis;

namespace CourageScores.Services.Analysis;

public class HighestScoresVisitor : AllThrowsSaygVisitor
{
    private readonly int _maxCount;

    public HighestScoresVisitor(int maxCount = 10)
        :base("HighestScores")
    {
        _maxCount = maxCount;
    }

    protected override ScoreBreakdownDto[] GetPerTeamBreakdown(IReadOnlyCollection<int> throws)
    {
        return throws
            .GroupBy(thr => thr)
            .OrderByDescending(gr => gr.Key)
            .Select(gr => new ScoreBreakdownDto(gr.Key, gr.Count()))
            .Take(_maxCount)
            .ToArray();
    }
}
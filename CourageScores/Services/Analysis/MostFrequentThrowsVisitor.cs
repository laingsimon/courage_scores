using CourageScores.Models.Dtos.Analysis;

namespace CourageScores.Services.Analysis;

public class MostFrequentThrowsVisitor : AllThrowsSaygVisitor
{
    private readonly int _maxCount;

    public MostFrequentThrowsVisitor(int maxCount = 10)
        :base("MostFrequentThrows")
    {
        _maxCount = maxCount;
    }

    protected override NumericBreakdownDto[] GetPerTeamBreakdown(IReadOnlyCollection<int> throws)
    {
        return throws
            .GroupBy(thr => thr)
            .OrderByDescending(gr => gr.Count())
            .Where(gr => gr.Count() > 1)
            .Select(gr => new NumericBreakdownDto(gr.Key, gr.Count()))
            .Take(_maxCount)
            .ToArray();
    }
}

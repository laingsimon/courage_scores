using CourageScores.Models.Dtos.Analysis;

namespace CourageScores.Services.Analysis;

public class SaygVisitorFactory : ISaygVisitorFactory
{
    public ISaygVisitor CreateForRequest(AnalysisRequestDto request)
    {
        return new CompositeSaygVisitor(
            new MostFrequentThrowsVisitor(request.MaxBreakdown),
            new MostFrequentPlayerVisitor(request.MaxBreakdown),
            new HighestScoresVisitor(request.MaxBreakdown));
    }
}
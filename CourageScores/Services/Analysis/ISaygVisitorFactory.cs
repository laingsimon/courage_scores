using CourageScores.Models.Dtos.Analysis;

namespace CourageScores.Services.Analysis;

public interface ISaygVisitorFactory
{
    ISaygVisitor CreateForRequest(AnalysisRequestDto request);
}
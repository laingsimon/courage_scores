using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class AnalysisResponseDto : Dictionary<string, IBreakdownDto>
{
}
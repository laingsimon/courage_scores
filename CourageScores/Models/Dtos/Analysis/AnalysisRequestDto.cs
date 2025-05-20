using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class AnalysisRequestDto
{
    public HashSet<Guid> TournamentIds { get; set; } = [];
    public int MaxBreakdown { get; set; } = 10;
}

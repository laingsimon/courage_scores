using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Analysis;

[ExcludeFromCodeCoverage]
public class AnalysisRequestDto
{
    public Guid[] TournamentIds { get; set; } = [];
}

using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Update portions of a tournament match
/// </summary>
[ExcludeFromCodeCoverage]
public class PatchTournamentMatchDto
{
    // identifiers for the match within the round
    public Guid SideA { get; set; }
    public Guid SideB { get; set; }

    public int? ScoreA { get; set; }
    public int? ScoreB { get; set; }
}
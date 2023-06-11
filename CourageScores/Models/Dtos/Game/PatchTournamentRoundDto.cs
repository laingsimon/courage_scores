using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Update portions of a tournament round
/// </summary>
[ExcludeFromCodeCoverage]
public class PatchTournamentRoundDto
{
    /// <summary>
    /// Optional match to update in this round
    /// </summary>
    public PatchTournamentMatchDto? Match { get; set; }

    /// <summary>
    /// Optional next round where an update will be found
    /// </summary>
    public PatchTournamentRoundDto? NextRound { get; set; }
}
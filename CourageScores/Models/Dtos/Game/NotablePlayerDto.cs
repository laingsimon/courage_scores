using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[ExcludeFromCodeCoverage]
public class NotablePlayerDto : GamePlayerDto
{
    /// <summary>
    /// Any notes about the player, e.g. new player, the checkout amount, etc.
    /// </summary>
    [Obsolete("Use " + nameof(Score) + " instead")]
    public string? Notes { get; set; }

    /// <summary>
    /// The score recorded for this player
    /// </summary>
    public int? Score { get; set; }
}
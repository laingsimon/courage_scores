using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[ExcludeFromCodeCoverage]
public class NotableTournamentPlayer : TournamentPlayer, INotablePlayer
{
    /// <summary>
    /// Any notes about the player, e.g. new player, the checkout amount, etc.
    /// </summary>
    public string? Notes { get; set; }
}
using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[ExcludeFromCodeCoverage]
public class NotablePlayer : GamePlayer
{
    /// <summary>
    /// Any notes about the player, e.g. new player, the checkout amount, etc.
    /// </summary>
    public string? Notes { get; set; }
}
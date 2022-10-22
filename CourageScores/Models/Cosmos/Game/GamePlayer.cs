using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a player who was playing
/// </summary>
[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "PropertyCanBeMadeInitOnly.Global")]
public class GamePlayer : AuditedEntity
{
    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;
}

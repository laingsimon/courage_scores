using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Team;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a player who was playing
/// </summary>
[ExcludeFromCodeCoverage]
public class GamePlayer : AuditedEntity, IGamePlayer
{
    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;

    public Gender? Gender { get; set; }
}

using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a player who was playing
/// </summary>
[ExcludeFromCodeCoverage]
public class TournamentSidePlayer : AuditedEntity
{
    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The division in which the player plays
    /// </summary>
    public Guid DivisionId { get; set; }
}
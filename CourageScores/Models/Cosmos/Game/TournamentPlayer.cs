using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a player who was playing
/// </summary>
[ExcludeFromCodeCoverage]
public class TournamentPlayer : AuditedEntity, IGamePlayer
{
    /// <summary>
    ///     The division in which the player plays
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;
}
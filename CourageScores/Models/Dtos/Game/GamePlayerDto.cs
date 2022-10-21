using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// The details of a player who was playing
/// </summary>
[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "PropertyCanBeMadeInitOnly.Global")]
public class GamePlayerDto : AuditedDto
{
    /// <summary>
    /// The id of the player
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;
}

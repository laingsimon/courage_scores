using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// The details of a player who was playing
/// </summary>
[ExcludeFromCodeCoverage]
public class GamePlayerDto : AuditedDto
{
    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;
}

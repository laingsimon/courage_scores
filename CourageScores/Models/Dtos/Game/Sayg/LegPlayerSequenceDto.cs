using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

/// <summary>
/// The position of the player in the sequence of players
/// </summary>
[ExcludeFromCodeCoverage]
public class LegPlayerSequenceDto
{
    /// <summary>
    /// The type of competitor, home or away
    /// </summary>
    public string Value { get; set; } = null!;

    /// <summary>
    /// The name of the competitor
    /// </summary>
    public string? Text { get; set; }
}
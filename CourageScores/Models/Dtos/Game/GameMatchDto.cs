using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// The record of a series of legs of a match between two players
/// </summary>
[ExcludeFromCodeCoverage]
public class GameMatchDto : AuditedDto
{
    /// <summary>
    /// Who played from the home team
    /// </summary>
    public List<GamePlayerDto> HomePlayers { get; set; } = new();

    /// <summary>
    /// Who played from the away team
    /// </summary>
    public List<GamePlayerDto> AwayPlayers { get; set; } = new();

    /// <summary>
    /// What was the home score
    /// </summary>
    public int? HomeScore { get; set; }

    /// <summary>
    /// What was the away score
    /// </summary>
    public int? AwayScore { get; set; }
}

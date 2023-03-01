using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Representation of a match in a tournament round
/// </summary>
[ExcludeFromCodeCoverage]
public class TournamentMatchDto : AuditedDto
{
    /// <summary>
    /// Who is playing from side a
    /// </summary>
    public TournamentSideDto SideA { get; set; } = null!;

    /// <summary>
    /// Who is playing from side b
    /// </summary>
    public TournamentSideDto SideB { get; set; } = null!;

    /// <summary>
    /// The score for side a
    /// </summary>
    public int? ScoreA { get; set; }

    /// <summary>
    /// The score for side b
    /// </summary>
    public int? ScoreB { get; set; }

    /// <summary>
    /// Options for each match in the game
    /// </summary>
    public List<GameMatchOptionDto> MatchOptions { get; set; } = new();
}
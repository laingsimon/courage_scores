namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Representation of a match in a knockout round
/// </summary>
public class KnockoutMatchDto : AuditedDto
{
    /// <summary>
    /// Who is playing from side a
    /// </summary>
    public KnockoutSideDto SideA { get; set; } = null!;

    /// <summary>
    /// Who is playing from side b
    /// </summary>
    public KnockoutSideDto SideB { get; set; } = null!;

    /// <summary>
    /// The score for side a
    /// </summary>
    public int? ScoreA { get; set; }

    /// <summary>
    /// The score for side b
    /// </summary>
    public int? ScoreB { get; set; }
}
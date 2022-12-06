namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// Representation of a match in a knockout round
/// </summary>
public class KnockoutMatch : AuditedEntity
{
    /// <summary>
    /// Who is playing from side a
    /// </summary>
    public KnockoutSide SideA { get; set; } = null!;

    /// <summary>
    /// Who is playing from side b
    /// </summary>
    public KnockoutSide SideB { get; set; } = null!;

    /// <summary>
    /// The score for side a
    /// </summary>
    public int? ScoreA { get; set; }

    /// <summary>
    /// The score for side b
    /// </summary>
    public int? ScoreB { get; set; }
}
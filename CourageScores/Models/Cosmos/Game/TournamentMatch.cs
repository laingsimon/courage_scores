namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// Representation of a match in a tournament round
/// </summary>
public class TournamentMatch : AuditedEntity, IGameVisitable
{
    /// <summary>
    /// Who is playing from side a
    /// </summary>
    public TournamentSide SideA { get; set; } = null!;

    /// <summary>
    /// Who is playing from side b
    /// </summary>
    public TournamentSide SideB { get; set; } = null!;

    /// <summary>
    /// The score for side a
    /// </summary>
    public int? ScoreA { get; set; }

    /// <summary>
    /// The score for side b
    /// </summary>
    public int? ScoreB { get; set; }

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitMatch(this);
    }
}
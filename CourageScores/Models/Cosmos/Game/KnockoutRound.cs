namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// Represents the matches within a round of a knockout game
/// </summary>
public class KnockoutRound : AuditedEntity, IGameVisitable
{
    /// <summary>
    /// Optional name for the round
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The sides that can play in the round
    /// </summary>
    public List<KnockoutSide> Sides { get; set; } = new();

    /// <summary>
    /// The matches that are-to-be/have-been played
    /// </summary>
    public List<KnockoutMatch> Matches { get; set; } = new();

    /// <summary>
    /// The details of the next round, winners against winners
    /// </summary>
    public KnockoutRound? NextRound { get; set; }

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitKnockoutRound(this);

        foreach (var match in Matches)
        {
            match.Accept(visitor);
        }

        NextRound?.Accept(visitor);

        if (Sides.Count == 2 && Matches.Count == 1 && Matches[0].ScoreA != null && Matches[0].ScoreB != null)
        {
            // get the winner
            var match = Matches.Single();
            visitor.VisitKnockoutFinal(match);

            if (match.ScoreA > match.ScoreB)
            {
                visitor.VisitKnockoutWinner(match.SideA);
            }
            else if (match.ScoreB > match.ScoreA)
            {
                visitor.VisitKnockoutWinner(match.SideB);
            }
        }
    }
}
namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// Represents the matches within a round of a tournament game
/// </summary>
public class TournamentRound : AuditedEntity, IGameVisitable
{
    /// <summary>
    /// Optional name for the round
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The sides that can play in the round
    /// </summary>
    public List<TournamentSide> Sides { get; set; } = new();

    /// <summary>
    /// The matches that are-to-be/have-been played
    /// </summary>
    public List<TournamentMatch> Matches { get; set; } = new();

    /// <summary>
    /// The details of the next round, winners against winners
    /// </summary>
    public TournamentRound? NextRound { get; set; }

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitRound(this);

        foreach (var match in Matches)
        {
            match.Accept(visitor);
        }

        NextRound?.Accept(visitor);

        if (Sides.Count == 2 && Matches.Count == 1)
        {
            // get the winner
            var match = Matches.Single();
            visitor.VisitFinal(match);

            if (match.ScoreA != null && match.ScoreB != null)
            {
                if (match.ScoreA > match.ScoreB)
                {
                    visitor.VisitTournamentWinner(match.SideA);
                }
                else if (match.ScoreB > match.ScoreA)
                {
                    visitor.VisitTournamentWinner(match.SideB);
                }
            }
        }
    }
}
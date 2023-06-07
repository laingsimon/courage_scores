﻿namespace CourageScores.Models.Cosmos.Game;

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

    /// <summary>
    /// Options for each match in the game
    /// </summary>
    public List<GameMatchOption?> MatchOptions { get; set; } = new();

    public void Accept(IVisitorScope scope, IGameVisitor visitor)
    {
        visitor.VisitRound(scope, this);

        foreach (var match in Matches)
        {
            match.Accept(scope, visitor);
        }

        NextRound?.Accept(scope, visitor);

        if (Sides.Count == 2 && Matches.Count == 1)
        {
            // get the winner
            var match = Matches.Single();
            visitor.VisitFinal(scope, match);

            if (match.ScoreA != null && match.ScoreB != null)
            {
                if (match.ScoreA > match.ScoreB)
                {
                    visitor.VisitTournamentWinner(scope, match.SideA);
                }
                else if (match.ScoreB > match.ScoreA)
                {
                    visitor.VisitTournamentWinner(scope, match.SideB);
                }
            }
        }
    }
}
namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// Represents the matches within a round of a knockout game
/// </summary>
public class KnockoutRound : AuditedEntity
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
}
using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The record of a series of legs of a match between two players
/// </summary>
[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "PropertyCanBeMadeInitOnly.Global")]
public class GameMatch : AuditedEntity
{
    /// <summary>
    /// The number of legs, typically 3 or 5
    /// </summary>
    public int? NumberOfLegs { get; set; }

    /// <summary>
    /// The starting score, typically 501 or 601 for triples
    /// </summary>
    public int? StartingScore { get; set; }

    /// <summary>
    /// Who played from the home team
    /// </summary>
    public GamePlayer[] HomePlayers { get; set; } = null!;

    /// <summary>
    /// Who played from the away team
    /// </summary>
    public GamePlayer[] AwayPlayers { get; set; } = null!;

    /// <summary>
    /// What was the home score
    /// </summary>
    public int HomeScore { get; set; }

    /// <summary>
    /// What was the away score
    /// </summary>
    public int AwayScore { get; set; }

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    public GamePlayer[] OneEighties { get; set; } = null!;

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    public NotablePlayer[] Over100Checkouts { get; set; } = null!;
}

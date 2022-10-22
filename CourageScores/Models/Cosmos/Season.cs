namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of a season within the league
/// </summary>
public class Season : AuditedEntity
{
    /// <summary>
    /// When the season starts
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// When the season ends
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// The divisions applicable to this season
    /// </summary>
    public Division[] Divisions { get; set; } = null!;

    /// <summary>
    /// The teams playing within the season (and which division they are attributed to)
    /// </summary>
    public Team.Team[] Teams { get; set; } = null!;

    /// <summary>
    /// The games that have, or are yet to be, played in this season
    /// </summary>
    public Game.Game[] Games { get; set; } = null!;
}

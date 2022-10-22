namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of all the data within the league
/// </summary>
public class League : AuditedEntity
{
    /// <summary>
    /// The divisions that have been defined within the league
    /// </summary>
    public Division[] Divisions { get; set; } = null!;

    /// <summary>
    /// The seasons that have been defined within the league
    /// </summary>
    public Season[] Seasons { get; set; } = null!;
}

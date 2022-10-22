namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of a division within the league
///
/// ASSUMPTION: This division sits above a season, and can exist across multiple seasons
/// </summary>
public class Division : AuditedEntity
{
    /// <summary>
    /// The name for the division
    /// </summary>
    public string Name { get; set; } = null!;
}

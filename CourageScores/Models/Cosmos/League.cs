﻿namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of all the data within the league
/// </summary>
public class League : AuditedEntity
{
    /// <summary>
    /// The name of the league
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The divisions that have been defined within the league
    /// </summary>
    public List<Division> Divisions { get; set; } = null!;

    /// <summary>
    /// The seasons that have been defined within the league
    /// </summary>
    public List<Season> Seasons { get; set; } = null!;
}

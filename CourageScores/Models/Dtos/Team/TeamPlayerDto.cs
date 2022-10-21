namespace CourageScores.Models.Dtos.Team;

/// <summary>
/// A record of a player that has played for a team within a season
/// </summary>
public class TeamPlayerDto : AuditedDto
{
    /// <summary>
    /// The id of the player
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Is this player the captain?
    /// </summary>
    public bool Captain { get; set; }
}

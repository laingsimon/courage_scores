using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Team;

/// <summary>
/// A record of a player that has played for a team within a season
/// </summary>
[ExcludeFromCodeCoverage]
public class TeamPlayerDto : AuditedDto
{
    /// <summary>
    /// The name of the player
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Is this player the captain?
    /// </summary>
    public bool Captain { get; set; }

    /// <summary>
    /// The email address for this player
    /// Only required if this player will perform any administration of data (e.g. uploading scores)
    /// </summary>
    public string? EmailAddress { get; set; }
}

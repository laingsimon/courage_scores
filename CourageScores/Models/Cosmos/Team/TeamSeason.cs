using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Team;

/// <summary>
/// A record of a season that a team has played within
/// </summary>
[ExcludeFromCodeCoverage]
public class TeamSeason : AuditedEntity
{
    /// <summary>
    /// The id of the season
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The players that played for the team during the season
    /// </summary>
    public List<TeamPlayer> Players { get; set; } = new();
}

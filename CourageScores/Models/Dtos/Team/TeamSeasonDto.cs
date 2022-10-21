namespace CourageScores.Models.Dtos.Team;

/// <summary>
/// A record of a season that a team has played within
/// </summary>
public class TeamSeasonDto : AuditedDto
{
    /// <summary>
    /// The id of the season
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The players that played for the team during the season
    /// </summary>
    public TeamPlayerDto[] Players { get; set; } = null!;
}

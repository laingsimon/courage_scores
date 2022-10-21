namespace CourageScores.Models.Dtos;

/// <summary>
/// A record of all the data within the league
/// </summary>
public class LeagueDto : AuditedDto
{
    /// <summary>
    /// The divisions that have been defined within the league
    /// </summary>
    public DivisionDto[] Divisions { get; set; } = null!;

    /// <summary>
    /// The seasons that have been defined within the league
    /// </summary>
    public SeasonDto[] Seasons { get; set; } = null!;
}

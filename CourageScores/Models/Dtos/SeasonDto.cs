using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Dtos;

/// <summary>
/// A record of a season within the league
/// </summary>
public class SeasonDto : AuditedDto
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
    public DivisionDto[] Division { get; set; } = null!;

    /// <summary>
    /// The teams playing within the season (and which division they are attributed to)
    /// </summary>
    public TeamDto[] Teams { get; set; } = null!;

    /// <summary>
    /// The games that have, or are yet to be, played in this season
    /// </summary>
    public GameDto[] Games { get; set; } = null!;
}

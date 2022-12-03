using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Dtos.Season;

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
    public List<DivisionDto> Divisions { get; set; } = null!;

    /// <summary>
    /// The name of this season
    /// </summary>
    public string Name { get; set; } = null!;
}

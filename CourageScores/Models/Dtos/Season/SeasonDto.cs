using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season;

/// <summary>
/// A record of a season within the league
/// </summary>
[ExcludeFromCodeCoverage]
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
    public List<DivisionDto> Divisions { get; set; } = new();

    /// <summary>
    /// The name of this season
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Is this the current season?
    /// </summary>
    public bool IsCurrent { get; set; }

    /// <summary>
    /// The time fixtures are supposed to commence per date
    /// </summary>
    public TimeSpan? FixtureStartTime { get; set; }

    /// <summary>
    /// The average expected duration of each fixture, in hours
    /// </summary>
    public int? FixtureDuration { get; set; }

    /// <summary>
    /// Allow users to set their favourite teams
    /// </summary>
    public bool? AllowFavouriteTeams { get; set; }
}

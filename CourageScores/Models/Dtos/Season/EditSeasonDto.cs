using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season;

[ExcludeFromCodeCoverage]
public class EditSeasonDto : IIntegrityCheckDto
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid? Id { get; set; }

    /// <summary>
    /// When the season starts
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// When the season ends
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// The name of this season
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Copy the teams from the given season id
    /// </summary>
    public Guid? CopyTeamsFromSeasonId { get; set; }

    /// <summary>
    /// List of divisions attributed to this season
    /// </summary>
    public List<Guid> DivisionIds { get; set; } = new();

    /// <summary>
    /// The time fixtures are supposed to commence per date
    /// </summary>
    public TimeSpan? FixtureStartTime { get; set; }

    /// <summary>
    /// The average expected duration of each fixture, in hours
    /// </summary>
    public int? FixtureDuration { get; set; }

    public DateTime? LastUpdated { get; set; }
}

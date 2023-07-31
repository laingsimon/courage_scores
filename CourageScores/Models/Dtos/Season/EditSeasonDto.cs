using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season;

[ExcludeFromCodeCoverage]
public class EditSeasonDto : IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }

    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid Id { get; set; }

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
}
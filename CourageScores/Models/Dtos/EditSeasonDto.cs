using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class EditSeasonDto
{
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
}
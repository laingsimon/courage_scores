using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos;

namespace CourageScores.Models.Dtos.Team;

/// <summary>
/// A record of a team and its players, where 'home' is for them, etc.
/// </summary>
[ExcludeFromCodeCoverage]
public class TeamDto : AuditedDto, INameAndAddress
{
    /// <summary>
    /// The name of the team
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The address for where 'home' is for the team
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// The seasons in which this team have played
    /// </summary>
    public List<TeamSeasonDto> Seasons { get; set; } = new();
}
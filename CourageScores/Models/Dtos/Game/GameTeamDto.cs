using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// The details of a team that are playing a game, and who they recorded as the player of the match
/// </summary>
[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "PropertyCanBeMadeInitOnly.Global")]
public class GameTeamDto : AuditedDto
{
    /// <summary>
    /// The id of the team
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The name of the team
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Who this team recorded as the man of the match
    /// </summary>
    public Guid? ManOfTheMatch { get; set; }
}

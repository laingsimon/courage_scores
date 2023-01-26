using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The details of a team that are playing a game, and who they recorded as the player of the match
/// </summary>
[ExcludeFromCodeCoverage]
public class GameTeam : AuditedEntity
{
    /// <summary>
    /// The name of the team
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Who this team recorded as the man of the match
    /// </summary>
    public Guid? ManOfTheMatch { get; set; }
}

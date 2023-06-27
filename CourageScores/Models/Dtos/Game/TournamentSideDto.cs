using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[ExcludeFromCodeCoverage]
public class TournamentSideDto : AuditedDto
{
    /// <summary>
    /// Optional name for the side, e.g. Riverside
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Optional id for the team
    /// </summary>    
    public Guid? TeamId { get; set; }

    /// <summary>
    /// The players in this side, e.g. the 2 players from the same team for doubles
    /// </summary>
    public List<TournamentPlayerDto> Players { get; set; } = new();

    /// <summary>
    /// Did this team show on the night
    /// </summary>
    public bool NoShow { get; set; }
}

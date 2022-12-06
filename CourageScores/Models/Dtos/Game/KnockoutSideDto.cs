namespace CourageScores.Models.Dtos.Game;

public class KnockoutSideDto : AuditedDto
{
    /// <summary>
    /// Optional name for the side, e.g. Riverside
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The players in this side, e.g. the 2 players from the same team for doubles
    /// </summary>
    public List<GamePlayerDto> Players { get; set; } = new();
}
namespace CourageScores.Models.Cosmos.Game;

public class KnockoutSide : AuditedEntity
{
    /// <summary>
    /// Optional name for the side, e.g. Riverside
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The players in this side, e.g. the 2 players from the same team for doubles
    /// </summary>
    public List<GamePlayer> Players { get; set; } = new();
}
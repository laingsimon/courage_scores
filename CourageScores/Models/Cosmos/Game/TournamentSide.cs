namespace CourageScores.Models.Cosmos.Game;

public class TournamentSide : AuditedEntity, IGameVisitable
{
    /// <summary>
    /// Optional name for the side, e.g. Riverside
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The players in this side, e.g. the 2 players from the same team for doubles
    /// </summary>
    public List<GamePlayer> Players { get; set; } = new();

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitSide(this);

        foreach (var player in Players)
        {
            visitor.VisitPlayer(player, -1); // TODO: Should tournament matches affect the player table?
        }
    }
}
namespace CourageScores.Models.Cosmos.Game;

public class TournamentSide : AuditedEntity, IGameVisitable
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
    public List<TournamentPlayer> Players { get; set; } = new();

    /// <summary>
    /// Did this team show on the night
    /// </summary>
    public bool NoShow { get; set; }

    public void Accept(IVisitorScope scope, IGameVisitor visitor)
    {
        visitor.VisitSide(scope, this);

        foreach (var player in Players)
        {
            visitor.VisitTournamentPlayer(scope, player);
        }
    }
}
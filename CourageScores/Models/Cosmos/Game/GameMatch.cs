namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// The record of a series of legs of a match between two players
/// </summary>
public class GameMatch : AuditedEntity, IGameVisitable
{
    public GameMatch()
    {
        Version = 2;
    }

    /// <summary>
    /// The number of legs, typically 3 or 5
    /// </summary>
    public int? NumberOfLegs { get; set; }

    /// <summary>
    /// The starting score, typically 501 or 601 for triples
    /// </summary>
    public int? StartingScore { get; set; }

    /// <summary>
    /// Who played from the home team
    /// </summary>
    public List<GamePlayer> HomePlayers { get; set; } = new();

    /// <summary>
    /// Who played from the away team
    /// </summary>
    public List<GamePlayer> AwayPlayers { get; set; } = new();

    /// <summary>
    /// What was the home score
    /// </summary>
    public int? HomeScore { get; set; }

    /// <summary>
    /// What was the away score
    /// </summary>
    public int? AwayScore { get; set; }

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    [Obsolete]
    public List<GamePlayer> OneEighties { get; set; } = new();

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    [Obsolete]
    public List<NotablePlayer> Over100Checkouts { get; set; } = new();

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitMatch(this);

        if (HomePlayers.Count == AwayPlayers.Count)
        {
            foreach (var player in HomePlayers)
            {
                visitor.VisitPlayer(player, HomePlayers.Count);
            }

            foreach (var player in AwayPlayers)
            {
                visitor.VisitPlayer(player, AwayPlayers.Count);
            }
        }

        if (HomeScore.HasValue && AwayScore.HasValue && HomePlayers.Count == AwayPlayers.Count)
        {
            if (HomeScore > AwayScore)
            {
                var homeWinBy = HomeScore - AwayScore;
                visitor.VisitMatchWin(HomePlayers, TeamDesignation.Home, homeWinBy.Value);
                visitor.VisitMatchLost(AwayPlayers, TeamDesignation.Away, homeWinBy.Value);
            }
            else if (AwayScore > HomeScore)
            {
                var awayWinBy = AwayScore - HomeScore;
                visitor.VisitMatchWin(AwayPlayers, TeamDesignation.Away, awayWinBy.Value);
                visitor.VisitMatchLost(HomePlayers, TeamDesignation.Home, awayWinBy.Value);
            }
            else
            {
                visitor.VisitMatchDraw(HomePlayers, AwayPlayers, HomeScore.Value);
            }
        }

#pragma warning disable CS0612
        foreach (var player in OneEighties)
#pragma warning restore CS0612
        {
            visitor.VisitOneEighty(player);
        }

#pragma warning disable CS0612
        foreach (var player in Over100Checkouts)
#pragma warning restore CS0612
        {
            visitor.VisitHiCheckout(player);
        }
    }
}

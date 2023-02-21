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
                visitor.VisitMatchWin(HomePlayers, TeamDesignation.Home, HomeScore.Value, AwayScore.Value);
                visitor.VisitMatchLost(AwayPlayers, TeamDesignation.Away, AwayScore.Value, HomeScore.Value);
            }
            else if (AwayScore > HomeScore)
            {
                visitor.VisitMatchWin(AwayPlayers, TeamDesignation.Away, AwayScore.Value, HomeScore.Value);
                visitor.VisitMatchLost(HomePlayers, TeamDesignation.Home, HomeScore.Value, AwayScore.Value);
            }

            // must be a 0-0 record (i.e. not played) - draw's aren't possible in matches (legs are 3,5 or 7 normally)
        }
        else
        {
            visitor.VisitDataError($"Mismatching number of players: Home players: [{string.Join(", ", HomePlayers.Select(p => p.Name))}] vs Away players: [{string.Join(", ", AwayPlayers.Select(p => p.Name))}]");
        }
    }
}

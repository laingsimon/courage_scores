using CourageScores.Models.Cosmos.Game.Sayg;

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

    public ScoreAsYouGo? Sayg { get; set; }

    public void Accept(IVisitorScope scope, IGameVisitor visitor)
    {
        visitor.VisitMatch(scope, this);

        if (HomePlayers.Count != AwayPlayers.Count)
        {
            var homePlayerList = string.Join(", ", HomePlayers.Select(p => p.Name));
            var awayPlayerList = string.Join(", ", AwayPlayers.Select(p => p.Name));
            visitor.VisitDataError(scope, $"Mismatching number of players: Home players ({HomePlayers.Count}): [{homePlayerList}] vs Away players ({AwayPlayers.Count}): [{awayPlayerList}]");
            return;
        }

        foreach (var player in HomePlayers)
        {
            visitor.VisitPlayer(scope, player, HomePlayers.Count);
        }

        foreach (var player in AwayPlayers)
        {
            visitor.VisitPlayer(scope, player, AwayPlayers.Count);
        }

        if (HomeScore.HasValue && AwayScore.HasValue)
        {
            if (HomeScore > AwayScore)
            {
                visitor.VisitMatchWin(scope, HomePlayers, TeamDesignation.Home, HomeScore.Value, AwayScore.Value);
                visitor.VisitMatchLost(scope, AwayPlayers, TeamDesignation.Away, AwayScore.Value, HomeScore.Value);
            }
            else if (AwayScore > HomeScore)
            {
                visitor.VisitMatchWin(scope, AwayPlayers, TeamDesignation.Away, AwayScore.Value, HomeScore.Value);
                visitor.VisitMatchLost(scope, HomePlayers, TeamDesignation.Home, HomeScore.Value, AwayScore.Value);
            }
            else
            {
                visitor.VisitDataError(scope, $"Match between {string.Join(", ", HomePlayers.Select(p => p.Name))} and {string.Join(", ", AwayPlayers.Select(p => p.Name))} is a {HomeScore}-{AwayScore} draw");
            }
        }
    }
}
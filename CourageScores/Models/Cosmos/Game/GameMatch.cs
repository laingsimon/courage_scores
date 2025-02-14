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
            AddDataErrorWithMessage(visitor, scope, $"has mis-matching number of players: Home players ({HomePlayers.Count}): [{homePlayerList}] vs Away players ({AwayPlayers.Count}): [{awayPlayerList}]");
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
            var matchOptions = scope.Game != null && scope.Index != null
                ? scope.Game.MatchOptions.ElementAtOrDefault(scope.Index.Value)
                : null;
            var homeWinningNumberOfLegs = (matchOptions?.NumberOfLegs / 2.0) ?? AwayScore;
            var awayWinningNumberOfLegs = (matchOptions?.NumberOfLegs / 2.0) ?? HomeScore;

            if (HomeScore > homeWinningNumberOfLegs)
            {
                visitor.VisitMatchWin(scope, HomePlayers, TeamDesignation.Home, HomeScore.Value, AwayScore.Value);
                visitor.VisitMatchLost(scope, AwayPlayers, TeamDesignation.Away, AwayScore.Value, HomeScore.Value);
            }
            else if (AwayScore > awayWinningNumberOfLegs)
            {
                visitor.VisitMatchWin(scope, AwayPlayers, TeamDesignation.Away, AwayScore.Value, HomeScore.Value);
                visitor.VisitMatchLost(scope, HomePlayers, TeamDesignation.Home, HomeScore.Value, AwayScore.Value);
            }
            if (AwayScore == HomeScore)
            {
                AddDataErrorWithMessage(visitor, scope, $"is a {HomeScore}-{AwayScore} draw, scores won't count on players table");
            }

            return;
        }

        if (HomeScore.HasValue || AwayScore.HasValue)
        {
            AddDataErrorWithMessage(visitor, scope, $"has only one score {HomeScore}-{AwayScore}, both are required to ensure the team/players table are rendered correctly");
        }
    }

    private void AddDataErrorWithMessage(IGameVisitor visitor, IVisitorScope scope, string message)
    {
        var game = scope.Game;
        var prefix = $"{GetMatchType(scope.Index) ?? "Match"} between {game?.Home?.Name ?? "unknown"} and {game?.Away?.Name ?? "unknown"}";

        visitor.VisitDataError(
            scope,
            $"{prefix} {message}");
    }

    private string? GetMatchType(int? scopeIndex)
    {
        if (scopeIndex == null)
        {
            return null;
        }

        var playerCount = (HomePlayers.Count + AwayPlayers.Count) / 2;
        return playerCount switch
        {
            1 => $"Singles match {scopeIndex + 1}",
            2 => "Pairs match",
            3 => "Triples match",
            _ => null,
        };
    }
}
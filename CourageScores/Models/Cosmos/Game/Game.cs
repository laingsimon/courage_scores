using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// A record of a number of matches played at a venue between 2 teams on a given date and time
/// </summary>
public class Game : AuditedEntity, IPermissionedEntity, IGameVisitable
{
    /// <summary>
    /// The id of the division
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// The date (and time)
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The venue, which may not be the home-team's address (e.g. for knockouts, finals, etc.)
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// Who played from the home team
    /// </summary>
    public GameTeam Home { get; set; } = null!;

    /// <summary>
    /// Who played from the away team
    /// </summary>
    public GameTeam Away { get; set; } = null!;

    /// <summary>
    /// The matches that were played
    /// </summary>
    public List<GameMatch> Matches { get; set; } = new();

    /// <summary>
    /// The id of the season in which the game is being played
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// Whether the game has been postponed
    /// </summary>
    public bool Postponed { get; set; }

    /// <summary>
    /// Is this a knockout game?
    /// </summary>
    public bool IsKnockout { get; set; }

    /// <summary>
    /// The scores as reported by the home team
    /// </summary>
    public Game? HomeSubmission { get; set; }

    /// <summary>
    /// The scores as reported by the away team
    /// </summary>
    public Game? AwaySubmission { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto user)
    {
        return user.Access?.ManageGames == true;
    }

    public void Accept(IGameVisitor visitor)
    {
        visitor.VisitGame(this);

        visitor.VisitTeam(Home, Matches.Any() ? GameState.Played : GameState.Pending);
        if (Home.ManOfTheMatch != null)
        {
            visitor.VisitManOfTheMatch(Home.ManOfTheMatch);
        }

        visitor.VisitTeam(Away, Matches.Any() ? GameState.Played : GameState.Pending);
        if (Away.ManOfTheMatch != null)
        {
            visitor.VisitManOfTheMatch(Away.ManOfTheMatch);
        }

        var gameScore = new GameScoreVisitor(Home, Away);
        foreach (var match in Matches)
        {
            match.Accept(gameScore);
            match.Accept(visitor);
        }

        gameScore.Accept(visitor);
    }

    private class GameScoreVisitor : IGameVisitor, IGameVisitable
    {
        private readonly GameTeam _home;
        private readonly GameTeam _away;
        private int _homeScore;
        private int _awayScore;

        public GameScoreVisitor(GameTeam home, GameTeam away)
        {
            _home = home;
            _away = away;
        }

        public void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team)
        {
            if (players.Count == 0)
            {
                return;
            }

            switch (team)
            {
                case TeamDesignation.Home:
                    _homeScore++;
                    break;
                case TeamDesignation.Away:
                    _awayScore++;
                    break;
            }
        }

        public void VisitMatchDraw(IReadOnlyCollection<GamePlayer> homePlayers, IReadOnlyCollection<GamePlayer> awayPlayers, int score)
        {
            if (homePlayers.Count == 0)
            {
                return;
            }

            _homeScore += score;
            _awayScore += score;
        }

        public void Accept(IGameVisitor visitor)
        {
            if (_homeScore > _awayScore)
            {
                visitor.VisitGameWinner(_home);
                visitor.VisitGameLost(_away);
            }
            else if (_awayScore > _homeScore)
            {
                visitor.VisitGameWinner(_away);
                visitor.VisitGameLost(_home);
            }
            else if (_homeScore == _awayScore && _homeScore > 0)
            {
                visitor.VisitGameDraw(_home, _away);
            }
        }
    }
}

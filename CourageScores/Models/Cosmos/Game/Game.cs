using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// A record of a number of matches played at a venue between 2 teams on a given date and time
/// </summary>
public class Game : AuditedEntity, IPermissionedEntity, IGameVisitable, IPhotoEntity
{
    public const int CurrentVersion = 2;

    public Game()
    {
        Version = CurrentVersion;
    }

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

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    public List<GamePlayer> OneEighties { get; set; } = new();

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    public List<NotablePlayer> Over100Checkouts { get; set; } = new();

    /// <summary>
    /// Options for each match in the game
    /// </summary>
    public List<GameMatchOption?> MatchOptions { get; set; } = new();

    public bool AccoladesCount { get; set; }

    /// <summary>
    /// Photos of the score card
    /// </summary>
    public List<PhotoReference> Photos { get; set; } = new();

    public void Accept(IVisitorScope scope, IGameVisitor visitor)
    {
        scope = scope.With(new VisitorScope
        {
            Game = this,
        });

        visitor.VisitGame(this);

        if (Postponed)
        {
            return;
        }

        visitor.VisitTeam(scope, Home, Matches.Any(m => m.HomeScore > 0 || m.AwayScore > 0) ? GameState.Played : GameState.Pending);
        if (Home.ManOfTheMatch != null)
        {
            visitor.VisitManOfTheMatch(scope, Home.ManOfTheMatch);
        }

        visitor.VisitTeam(scope, Away, Matches.Any(m => m.HomeScore > 0 || m.AwayScore > 0) ? GameState.Played : GameState.Pending);
        if (Away.ManOfTheMatch != null)
        {
            visitor.VisitManOfTheMatch(scope, Away.ManOfTheMatch);
        }

        var gameScore = new GameScoreVisitor(Home, Away);
        foreach (var match in Matches)
        {
            match.Accept(scope, gameScore);
            match.Accept(scope, visitor);
        }

        gameScore.Accept(scope, visitor);

        if (AccoladesCount)
        {
            foreach (var player in OneEighties)
            {
                visitor.VisitOneEighty(scope, player);
            }

            foreach (var player in Over100Checkouts)
            {
                visitor.VisitHiCheckout(scope, player);
            }
        }
    }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
        return user?.Access?.ManageGames == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
        return user?.Access?.ManageGames == true || user?.Access?.InputResults == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
        return user?.Access?.ManageGames == true;
    }

    private class GameScoreVisitor : IGameVisitor, IGameVisitable
    {
        private readonly GameTeam _away;
        private readonly GameTeam _home;
        private int _awayScore;
        private int _homeScore;

        public GameScoreVisitor(GameTeam home, GameTeam away)
        {
            _home = home;
            _away = away;
        }

        public void Accept(IVisitorScope scope, IGameVisitor visitor)
        {
            if (_homeScore > _awayScore)
            {
                visitor.VisitGameWinner(scope, _home);
                visitor.VisitGameLoser(scope, _away);
            }
            else if (_awayScore > _homeScore)
            {
                visitor.VisitGameWinner(scope, _away);
                visitor.VisitGameLoser(scope, _home);
            }
            else if (_homeScore == _awayScore && _homeScore > 0)
            {
                visitor.VisitGameDraw(scope, _home, _away);
            }
        }

        public void VisitMatchWin(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team,
            int winningScore, int losingScore)
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
    }
}
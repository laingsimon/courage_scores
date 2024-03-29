using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

[ExcludeFromCodeCoverage]
public class DivisionData
{
    /// <summary>
    /// PlayerId -> Score map
    /// </summary>
    public Dictionary<Guid, PlayerScore> Players { get; } = new();

    /// <summary>
    /// TeamId -> score map
    /// </summary>
    public Dictionary<Guid, TeamScore> Teams { get; } = new();

    /// <summary>
    /// PlayerId -> GameId map
    /// </summary>
    public Dictionary<Guid, Dictionary<DateTime, Guid>> PlayersToFixtures { get; } = new();

    /// <summary>
    /// A list of all known data errors
    /// </summary>
    public List<DataErrorDto> DataErrors { get; } = new();

    public class PlayerPlayScore
    {
        public int MatchesWon { get; set; }
        public int MatchesLost { get; set; }
        public int MatchesPlayed { get; set; }

        public int TeamLossRate { get; set; }
        public int TeamWinRate { get; set; }

        public int PlayerLossRate { get; set; }
        public int PlayerWinRate { get; set; }
    }

    public class PlayerScore
    {
        public IGamePlayer? Player { get; init; }
        public GameTeam? Team { get; init; }

        public int OneEighties { get; set; }
        public int HiCheckout { get; set; }

        public double PlayerWinPercentage => GetScores(1).MatchesPlayed == 0
            ? 0
            // ReSharper disable once ArrangeRedundantParentheses
            : Math.Round(((double)GetScores(1).MatchesWon/GetScores(1).MatchesPlayed)*100, 2);

        public Dictionary<int, PlayerPlayScore> PlayerPlayCount { get; } = new();

        // ReSharper disable once CollectionNeverQueried.Global
        public HashSet<Models.Cosmos.Game.Game?> Games { get; } = new();

        // ReSharper disable once CollectionNeverQueried.Global
        public HashSet<TournamentGame?> Tournaments { get; } = new();

        /// <summary>
        /// Have any of the hi-checks or one-eighties come from a knockout fixture?
        /// </summary>
        public bool FromKnockout { get; set; }

        public PlayerPlayScore GetScores(int playerCount)
        {
            if (!PlayerPlayCount.TryGetValue(playerCount, out var score))
            {
                score = new PlayerPlayScore();
                PlayerPlayCount.Add(playerCount, score);
            }

            return score;
        }
    }

    public class TeamScore
    {
        public int FixturesWon { get; set; }
        public int FixturesDrawn { get; set; }
        public int FixturesPlayed { get; set; }
        public int FixturesLost { get; set; }

        public int CalculatePoints()
        {
            // ReSharper disable ArrangeRedundantParentheses
            return (FixturesWon*2) + (FixturesDrawn*1);
            // ReSharper restore ArrangeRedundantParentheses
        }
    }

    public class TeamPlayerTuple
    {
        public TeamPlayerTuple(TeamPlayerDto player, TeamDto team)
        {
            Player = player;
            Team = team;
        }

        public TeamPlayerDto Player { get; }
        public TeamDto Team { get; }
    }
}
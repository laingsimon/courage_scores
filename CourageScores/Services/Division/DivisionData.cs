using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

[ExcludeFromCodeCoverage]
public class DivisionData
{
    /// <summary>
    /// PlayerId -> Score map
    /// </summary>
    public Dictionary<Guid, PlayerScore> Players { get; } = new ();

    /// <summary>
    /// TeamId -> score map
    /// </summary>
    public Dictionary<Guid, TeamScore> Teams { get; } = new();

    /// <summary>
    /// PlayerId -> GameId map
    /// </summary>
    public Dictionary<Guid, Dictionary<DateTime, Guid>> PlayersToFixtures { get; } = new();

    /// <summary>
    /// PlayerId -> TeamPlayerTuple map
    /// </summary>
    public Dictionary<Guid, TeamPlayerTuple> PlayerIdToTeamLookup { get; } = new();

    public interface IScore
    {
        int Draw { get; set; }
    }

    public class PlayerPlayScore : IScore
    {
        public int Win { get; set; }
        public int Draw { get; set; }
        public int Lost { get; set; }
        public int Played { get; set; }
    }

    public class PlayerScore : IScore
    {
        public IGamePlayer? Player { get; init; }

        public int Draw
        {
            get => GetScores(1).Draw;
            set => GetScores(1).Draw = value;
        }
        public int OneEighty { get; set; }
        public int HiCheckout { get; set; }
        public double PlayerWinPercentage => GetScores(1).Played == 0
            ? 0
            // ReSharper disable once ArrangeRedundantParentheses
            : Math.Round(((double)GetScores(1).Win / GetScores(1).Played) * 100, 2);

        public Dictionary<int, PlayerPlayScore> PlayerPlayCount { get; } = new();

        public PlayerPlayScore GetScores(int playerCount)
        {
            if (!PlayerPlayCount.TryGetValue(playerCount, out var score))
            {
                score = new PlayerPlayScore();
                PlayerPlayCount.Add(playerCount, score);
            }

            return score;
        }

        public int CalculatePoints()
        {
            // ReSharper disable ArrangeRedundantParentheses
            return (GetScores(1).Win * 3) + (GetScores(1).Draw * 1);
            // ReSharper restore ArrangeRedundantParentheses
        }
    }

    public class TeamScore : IScore
    {
        public int Win { get; set; }
        public int Draw { get; set; }
        public int Played { get; set; }
        public int Lost { get; set; }

        public int CalculatePoints()
        {
            // ReSharper disable ArrangeRedundantParentheses
            return (Win * 2) + (Draw * 1);
            // ReSharper restore ArrangeRedundantParentheses
        }
    }

    public class TeamPlayerTuple
    {
        public TeamPlayerDto Player { get; }
        public TeamDto Team { get; }

        public TeamPlayerTuple(TeamPlayerDto player, TeamDto team)
        {
            Player = player;
            Team = team;
        }
    }
}
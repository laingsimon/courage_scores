using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

public class DivisionData
{
    public Dictionary<Guid, Score> Players { get; } = new ();
    public Dictionary<Guid, Score> Teams { get; } = new();
    public Dictionary<Guid, Dictionary<DateTime, Guid>> PlayersToFixtures { get; } = new();
    public Dictionary<Guid, TeamPlayerTuple> PlayerIdToTeamLookup { get; } = new();

    public class Score
    {
        public GamePlayer? Player { get; init; }
        public GameTeam? Team { get; set; }
        public int Win { get; set; }
        public int Draw { get; set; }
        public int OneEighty { get; set; }
        public int HiCheckout { get; set; }
        public int Played { get; set; }
        public int Lost { get; set; }
        public double WinPercentage => Math.Round((double)Win / Played * 100, 2);
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
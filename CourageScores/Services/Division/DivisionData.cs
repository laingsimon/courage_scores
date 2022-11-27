using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Division;

public class DivisionData
{
    public readonly Dictionary<Guid, Score> Players = new ();
    public readonly Dictionary<Guid, Score> Teams = new ();

    public class Score
    {
        public GamePlayer? Player { get; set; }
        public GameTeam? Team { get; set; }
        public int Win { get; set; }
        public int Draw { get; set; }
        public int OneEighty { get; set; }
        public int HiCheckout { get; set; }
        public int Played { get; set; }
        public int Lost { get; set; }
        public double WinPercentage => Math.Round((double)Win / Played * 100, 2);
    }
}
namespace CourageScores.Models.Dtos.Game;

public class RecordScoresDto
{
    public ManOfTheMatchDto Home { get; set; } = null!;
    public ManOfTheMatchDto Away { get; set; } = null!;
    public List<RecordScoresMatchDto> Matches { get; set; } = null!;

    public class ManOfTheMatchDto
    {
        public Guid ManOfTheMatch { get; set; }
    }

    public class RecordScoresMatchDto
    {
        public List<RecordScoresPlayerDto> HomePlayers { get; set; } = null!;
        public int HomeScore { get; set; }
        public List<RecordScoresPlayerDto> AwayPlayers { get; set; } = null!;
        public int AwayScore { get; set; }
        public List<RecordScoresPlayerDto> OneEighties { get; set; } = new ();
        public List<Over100CheckoutDto> Over100Checkouts { get; set; } = new ();
    }

    public class RecordScoresPlayerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
    }

    public class Over100CheckoutDto : RecordScoresPlayerDto
    {
        public string Notes { get; set; } = null!;
    }
}
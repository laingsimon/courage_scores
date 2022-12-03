namespace CourageScores.Models.Dtos.Game;

public class RecordScoresDto
{
    public ManOfTheMatchDto? Home { get; set; }
    public ManOfTheMatchDto? Away { get; set; }
    public List<RecordScoresMatchDto> Matches { get; set; } = null!;
    public string? Address { get; set; }
    public bool? Postponed { get; set; }

    public class ManOfTheMatchDto
    {
        public Guid? ManOfTheMatch { get; set; }
    }

    public class RecordScoresMatchDto
    {
        public List<RecordScoresPlayerDto> HomePlayers { get; set; } = new();
        public int? HomeScore { get; set; }
        public List<RecordScoresPlayerDto> AwayPlayers { get; set; } = new();
        public int? AwayScore { get; set; }
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
        public string? Notes { get; set; }
    }
}
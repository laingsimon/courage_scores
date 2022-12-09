namespace CourageScores.Models.Dtos.Game;

public class RecordScoresDto
{
    public ManOfTheMatchDto? Home { get; set; }
    public ManOfTheMatchDto? Away { get; set; }
    public List<RecordScoresGameMatchDto> Matches { get; set; } = null!;
    public string? Address { get; set; }
    public bool? Postponed { get; set; }

    public class ManOfTheMatchDto
    {
        public Guid? ManOfTheMatch { get; set; }
    }

    public class RecordScoresGameMatchDto
    {
        public List<RecordScoresGamePlayerDto> HomePlayers { get; set; } = new();
        public int? HomeScore { get; set; }
        public List<RecordScoresGamePlayerDto> AwayPlayers { get; set; } = new();
        public int? AwayScore { get; set; }
        public List<RecordScoresGamePlayerDto> OneEighties { get; set; } = new ();
        public List<GameOver100CheckoutDto> Over100Checkouts { get; set; } = new ();
    }

    public class RecordScoresGamePlayerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
    }

    public class GameOver100CheckoutDto : RecordScoresGamePlayerDto
    {
        public string? Notes { get; set; }
    }
}
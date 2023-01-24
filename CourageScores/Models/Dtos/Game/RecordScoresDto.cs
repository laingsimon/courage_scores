namespace CourageScores.Models.Dtos.Game;

public class RecordScoresDto
{
    public ManOfTheMatchDto? Home { get; set; } = new();
    public ManOfTheMatchDto? Away { get; set; } = new();
    public List<RecordScoresGameMatchDto> Matches { get; set; } = new();
    public string? Address { get; set; }
    public bool? Postponed { get; set; }
    public bool? IsKnockout { get; set; }
    public DateTime? Date { get; set; }
    public List<RecordScoresGamePlayerDto> OneEighties { get; set; } = new();
    public List<GameOver100CheckoutDto> Over100Checkouts { get; set; } = new();

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
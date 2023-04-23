namespace CourageScores.Models.Cosmos.Game.Sayg;

public class RecordedScoreAsYouGo : AuditedEntity
{
    public Dictionary<int, Leg> Legs { get; set; } = new();
    public string YourName { get; set; } = null!;
    public string? OpponentName { get; set; }
    public int NumberOfLegs { get; set; }
    public int StartingScore { get; set; }
    public int HomeScore { get; set; }
    public int? AwayScore { get; set; }
}
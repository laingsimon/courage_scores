namespace CourageScores.Models.Cosmos.Game.Sayg;

public class Leg
{
    public int StartingScore { get; set; }
    public CompetitorType? Winner { get; set; }
    public LegCompetitorScore Home { get; set; } = null!;
    public LegCompetitorScore Away { get; set; } = null!;
    public List<LegPlayerSequence> PlayerSequence { get; set; } = new();
    public CompetitorType? CurrentThrow { get; set; }
}
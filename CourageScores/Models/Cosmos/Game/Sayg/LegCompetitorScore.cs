namespace CourageScores.Models.Cosmos.Game.Sayg;

public class LegCompetitorScore
{
    public bool Bust { get; set; }
    public List<LegThrow> Throws { get; set; } = new();
}
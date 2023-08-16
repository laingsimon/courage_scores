namespace CourageScores.Models.Cosmos.Game.Sayg;

public class ScoreAsYouGo : CosmosEntity, IScoreAsYouGo
{
    public Dictionary<int, Leg> Legs { get; set; } = new();
}
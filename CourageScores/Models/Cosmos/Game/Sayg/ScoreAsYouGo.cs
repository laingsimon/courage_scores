namespace CourageScores.Models.Cosmos.Game.Sayg;

public class ScoreAsYouGo : CosmosEntity
{
    public Dictionary<int, Leg> Legs { get; set; } = new();
}
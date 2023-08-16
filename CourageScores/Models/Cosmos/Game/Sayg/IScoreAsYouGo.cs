namespace CourageScores.Models.Cosmos.Game.Sayg;

public interface IScoreAsYouGo
{
    Dictionary<int, Leg> Legs { get; set; }
}
namespace CourageScores.Models.Cosmos.Game.Sayg;

public class RecordedScoreAsYouGo : AuditedEntity
{
    /// <summary>
    /// The legs for the match
    /// </summary>
    public Dictionary<int, Leg> Legs { get; set; } = new();
}
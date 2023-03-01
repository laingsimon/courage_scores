namespace CourageScores.Models.Cosmos.Game;

/// <summary>
/// Options for each match
/// </summary>
public class GameMatchOption
{
    /// <summary>
    /// The number of legs for the match, if not the default
    /// </summary>
    public int? NumberOfLegs { get; set; }

    /// <summary>
    /// The starting score for the match, if not the default
    /// </summary>
    public int? StartingScore { get; set; }
}
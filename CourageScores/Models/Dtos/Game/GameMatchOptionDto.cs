namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Options for each match
/// </summary>
public class GameMatchOptionDto
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
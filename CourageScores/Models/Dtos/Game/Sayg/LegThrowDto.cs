namespace CourageScores.Models.Dtos.Game.Sayg;

/// <summary>
/// Details of a throw
/// </summary>
public class LegThrowDto
{
    /// <summary>
    /// The score attained with the darts thrown
    /// </summary>
    public int Score { get; set; }

    /// <summary>
    /// The number of darts thrown
    /// </summary>
    public int NoOfDarts { get; set; }
}
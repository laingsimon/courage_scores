namespace CourageScores.Models.Dtos.Game.Sayg;

/// <summary>
/// The details of a leg
/// </summary>
public class LegDto
{
    /// <summary>
    /// The starting score for the leg
    /// </summary>
    public int StartingScore { get; set; }

    /// <summary>
    /// If any, the winner of the leg
    /// </summary>
    public string? Winner { get; set; }

    /// <summary>
    /// Who is playing from the home 'side'
    /// </summary>
    public LegCompetitorScoreDto Home { get; set; } = null!;

    /// <summary>
    /// Who is playing from the away 'side'
    /// </summary>
    public LegCompetitorScoreDto Away { get; set; } = null!;

    /// <summary>
    /// The sequence of players, e.g. home then away or the reverse
    /// </summary>
    public List<LegPlayerSequenceDto> PlayerSequence { get; set; } = new();

    /// <summary>
    /// The player that is/should throw now
    /// </summary>
    public string? CurrentThrow { get; set; }

    /// <summary>
    /// Is this the last leg of the match?
    /// </summary>
    public bool IsLastLeg { get; set; }
}
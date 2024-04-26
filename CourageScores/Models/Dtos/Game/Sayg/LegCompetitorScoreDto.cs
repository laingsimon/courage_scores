using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

/// <summary>
/// Details of the score for a competitor
/// </summary>
[ExcludeFromCodeCoverage]
public class LegCompetitorScoreDto
{
    /// <summary>
    /// The total number of darts thrown in this leg
    /// </summary>
    public int NoOfDarts { get; set; }

    /// <summary>
    /// The total score in this leg
    /// </summary>
    public int Score { get; set; }

    /// <summary>
    /// The details of the darts thrown by this competitor in this leg
    /// </summary>
    public List<LegThrowDto> Throws { get; set; } = new();
}
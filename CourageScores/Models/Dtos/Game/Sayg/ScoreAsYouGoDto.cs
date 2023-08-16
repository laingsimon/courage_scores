using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

/// <summary>
/// Details of scores in a match
/// </summary>
[ExcludeFromCodeCoverage]
public class ScoreAsYouGoDto : IScoreAsYouGoDto
{
    /// <summary>
    /// The legs for the match
    /// </summary>
    public Dictionary<int, LegDto> Legs { get; set; } = new();
}
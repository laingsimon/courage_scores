using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game.Sayg;

[ExcludeFromCodeCoverage]
public class RecordedScoreAsYouGoDto : AuditedDto
{
    /// <summary>
    /// The legs for the match
    /// </summary>
    public Dictionary<int, LegDto> Legs { get; set; } = new();

    /// <summary>
    /// Your name
    /// </summary>
    public string YourName { get; set; } = null!;

    /// <summary>
    /// An optional opponent name
    /// </summary>
    public string? OpponentName { get; set; }

    /// <summary>
    /// The number of legs
    /// </summary>
    public int NumberOfLegs { get; set; }

    /// <summary>
    /// The starting score
    /// </summary>
    public int StartingScore { get; set; }

    /// <summary>
    /// Your score
    /// </summary>
    public int HomeScore { get; set; }

    /// <summary>
    /// Opponent score, if applicable
    /// </summary>
    public int? AwayScore { get; set; }
}
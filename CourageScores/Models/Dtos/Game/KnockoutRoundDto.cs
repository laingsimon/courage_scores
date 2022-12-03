namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Represents the matches within a round of a knockout game
/// </summary>
public class KnockoutRoundDto : AuditedDto
{
    /// <summary>
    /// Optional name for the round
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// The sides that can play in the round
    /// </summary>
    public List<KnockoutSideDto> Sides { get; set; } = new();

    /// <summary>
    /// The matches that are-to-be/have-been played
    /// </summary>
    public List<KnockoutMatchDto> Matches { get; set; } = new();

    /// <summary>
    /// The details of the next round, winners against winners
    /// </summary>
    public KnockoutRoundDto? NextRound { get; set; }
}
namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// The details of a knockout game
/// </summary>
public class KnockoutGameDto : AuditedDto
{
    /// <summary>
    /// The date for the knockout game
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The season for the knockout game
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The sides that can play in the game
    /// </summary>
    public List<KnockoutSideDto> Sides { get; set; } = new();

    /// <summary>
    /// The first round of the knockout game
    /// </summary>
    public KnockoutRoundDto? Round { get; set; }

    /// <summary>
    /// The address for the knockout games
    /// </summary>
    public string Address { get; set; } = null!;
}

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// The details of a tournament game
/// </summary>
public class TournamentGameDto : AuditedDto
{
    /// <summary>
    /// The date for the tournament game
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The season for the tournament game
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The sides that can play in the game
    /// </summary>
    public List<TournamentSideDto> Sides { get; set; } = new();

    /// <summary>
    /// The first round of the tournament game
    /// </summary>
    public TournamentRoundDto? Round { get; set; }

    /// <summary>
    /// The address for the tournament games
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    public List<GamePlayerDto> OneEighties { get; set; } = null!;

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    public List<NotablePlayerDto> Over100Checkouts { get; set; } = null!;
}

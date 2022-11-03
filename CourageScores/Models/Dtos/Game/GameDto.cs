using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// A record of a number of matches played at a venue between 2 teams on a given date and time
/// </summary>
[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "PropertyCanBeMadeInitOnly.Global")]
public class GameDto : AuditedDto
{
    /// <summary>
    /// The id of the division
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// The id of the season in which the game is being played
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The date (and time)
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The venue, which may not be the home-team's address (e.g. for knockouts, finals, etc.)
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// Who played from the home team
    /// </summary>
    public GameTeamDto Home { get; set; } = null!;

    /// <summary>
    /// Who played from the away team
    /// </summary>
    public GameTeamDto Away { get; set; } = null!;

    /// <summary>
    /// The matches that were played
    /// </summary>
    public List<GameMatchDto> Matches { get; set; } = null!;
}

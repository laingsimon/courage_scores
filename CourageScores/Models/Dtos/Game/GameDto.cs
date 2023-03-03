using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// A record of a number of matches played at a venue between 2 teams on a given date and time
/// </summary>
[ExcludeFromCodeCoverage]
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
    public List<GameMatchDto> Matches { get; set; } = new();

    /// <summary>
    /// Whether the game has been postponed
    /// </summary>
    public bool Postponed { get; set; }

    /// <summary>
    /// Is this a knockout game?
    /// </summary>
    public bool IsKnockout { get; set; }

    /// <summary>
    /// The scores as reported by the home team
    /// </summary>
    public GameDto? HomeSubmission { get; set; }

    /// <summary>
    /// The scores as reported by the away team
    /// </summary>
    public GameDto? AwaySubmission { get; set; }

    /// <summary>
    /// Have the results been published? If so no submissions are permitted.
    /// </summary>
    public bool ResultsPublished { get; set; }

    /// <summary>
    /// Who scored a 180 in the match
    /// </summary>
    public List<GamePlayerDto> OneEighties { get; set; } = new();

    /// <summary>
    /// Who checked out with more than 100
    /// </summary>
    public List<NotablePlayerDto> Over100Checkouts { get; set; } = new();

    /// <summary>
    /// Options for each match in the game
    /// </summary>
    public List<GameMatchOptionDto?> MatchOptions { get; set; } = new();
}

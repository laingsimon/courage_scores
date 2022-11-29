namespace CourageScores.Models.Dtos.Season;

/// <summary>
/// Define the parameters for auto provisioning games
/// </summary>
public class AutoProvisionGamesRequest
{
    /// <summary>
    /// The division
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// The season
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// [Optional] Use the team ids, rather than every team in the season/division
    /// </summary>
    public List<Guid> Teams { get; set; } = new();

    /// <summary>
    /// [Optional] Which day of the week should the games occur on?
    /// </summary>
    public DayOfWeek? WeekDay { get; set; } = DayOfWeek.Thursday;

    /// <summary>
    /// Which dates, if any, can games NOT occur on?
    /// </summary>
    public Dictionary<DateTime, string> ExcludedDates { get; set; } = new();

    /// <summary>
    /// How may days between games
    /// </summary>
    public int FrequencyDays { get; set; } = 7;

    /// <summary>
    /// How many legs should there be, 1 = play each team combination once, 2 = play each team combination once at home and once away
    /// </summary>
    public int NumberOfLegs { get; set; } = 2;

    /// <summary>
    /// Start the games from this date, rather than the season start date
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// The level of logging to return
    /// </summary>
    public LogLevel LogLevel { get; set; } = LogLevel.Warning;
}
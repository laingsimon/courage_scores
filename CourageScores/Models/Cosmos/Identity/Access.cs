namespace CourageScores.Models.Cosmos.Identity;

public class Access
{
    /// <summary>
    /// Does this user have access to manage users?
    /// </summary>
    public bool UserAdmin { get; set; }

    /// <summary>
    /// Does this user have access to manage the seasons and divisions?
    /// </summary>
    public bool LeagueAdmin { get; set; }

    /// <summary>
    /// Does this user have access to manage teams?
    /// </summary>
    public bool TeamAdmin { get; set; }

    /// <summary>
    /// Does this user have access to manage games, dates, players, etc?
    /// </summary>
    public bool GameAdmin { get; set; }
}
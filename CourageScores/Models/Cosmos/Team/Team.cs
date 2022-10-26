using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Team;

/// <summary>
/// A record of a team and its players, where 'home' is for them, etc.
/// </summary>
public class Team : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// The name of the team
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The address for where 'home' is for the team
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// The id of the division in which the team plays
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// The seasons in which this team have played
    /// </summary>
    public List<TeamSeason> Seasons { get; set; } = new();

    public bool CanCreate(UserDto user)
    {
        return (user.Access?.TeamAdmin ?? false) || (user.Access?.LeagueAdmin ?? false);
    }

    public bool CanEdit(UserDto user)
    {
        return (user.Access?.TeamAdmin ?? false) || (user.Access?.LeagueAdmin ?? false);
    }

    public bool CanDelete(UserDto user)
    {
        return (user.Access?.TeamAdmin ?? false) || (user.Access?.LeagueAdmin ?? false);
    }
}

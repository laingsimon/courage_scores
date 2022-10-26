using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of a division within the league
///
/// ASSUMPTION: This division sits above a season, and can exist across multiple seasons
/// </summary>
public class Division : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// The name for the division
    /// </summary>
    public string Name { get; set; } = null!;

    public bool CanCreate(UserDto user)
    {
        return user.Access?.LeagueAdmin == true;
    }

    public bool CanEdit(UserDto user)
    {
        return user.Access?.LeagueAdmin == true;
    }

    public bool CanDelete(UserDto user)
    {
        return user.Access?.LeagueAdmin == true;
    }
}

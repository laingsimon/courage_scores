using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of a season within the league
/// </summary>
public class Season : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// When the season starts
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// When the season ends
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// The divisions applicable to this season
    /// </summary>
    public List<Division> Divisions { get; set; } = new();

    /// <summary>
    /// The name of this season
    /// </summary>
    public string Name { get; set; } = null!;

    public bool CanCreate(UserDto user)
    {
        return user.Access?.ManageSeasons == true;
    }

    public bool CanEdit(UserDto user)
    {
        return user.Access?.ManageSeasons == true;
    }

    public bool CanDelete(UserDto user)
    {
        return user.Access?.ManageSeasons == true;
    }
}

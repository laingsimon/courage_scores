using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

/// <summary>
/// A record of a division within the league
/// </summary>
[ExcludeFromCodeCoverage]
public class Division : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// The name for the division
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Is this division meant to be for superleague tournaments only
    /// </summary>
    public bool Superleague { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
        return user?.Access?.ManageDivisions == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
        return user?.Access?.ManageDivisions == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
        return user?.Access?.ManageDivisions == true;
    }
}
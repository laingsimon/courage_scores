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
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.ManageDivisions == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.ManageDivisions == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.ManageDivisions == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }
}

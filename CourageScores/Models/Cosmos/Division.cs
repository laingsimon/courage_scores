using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Identity;

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
    public async Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageDivisions, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageDivisions, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageDivisions, token);
    }
}

using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos.Team;

/// <summary>
/// A record of a team and its players, where 'home' is for them, etc.
/// </summary>
[ExcludeFromCodeCoverage]
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
    /// The seasons in which this team have played
    /// </summary>
    public List<TeamSeason> Seasons { get; set; } = new();

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageTeams, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageTeams, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageTeams, token);
    }
}

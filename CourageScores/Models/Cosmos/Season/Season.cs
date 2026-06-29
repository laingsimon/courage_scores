using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos.Season;

/// <summary>
/// A record of a season within the league
/// </summary>
[ExcludeFromCodeCoverage]
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

    /// <summary>
    /// The time fixtures are supposed to commence per date
    /// </summary>
    public TimeSpan? FixtureStartTime { get; set; }

    /// <summary>
    /// The average expected duration of each fixture, in hours
    /// </summary>
    public int? FixtureDuration { get; set; }

    /// <summary>
    /// Allow users to set their favourite teams
    /// </summary>
    public bool? AllowFavouriteTeams { get; set; }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageSeasons, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageSeasons, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageSeasons, token);
    }
}

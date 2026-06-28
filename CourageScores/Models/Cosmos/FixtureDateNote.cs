using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos;

[ExcludeFromCodeCoverage]
public class FixtureDateNote : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// The date for which this note applies
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The note to display
    /// </summary>
    public string Note { get; set; } = null!;

    /// <summary>
    /// The season for which this note applies
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// [Optional] The division for which this note applies
    /// </summary>
    public Guid? DivisionId { get; set; }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageNotes, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageNotes, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageNotes, token);
    }
}

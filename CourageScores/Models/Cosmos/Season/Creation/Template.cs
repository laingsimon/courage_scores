using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class Template : AuditedEntity, IPermissionedEntity
{
    public string Name { get; set; } = null!;
    public List<DivisionTemplate> Divisions { get; set; } = new();
    public List<List<string>> SharedAddresses { get; set; } = new();
    public SeasonHealthCheckResultDto? TemplateHealth { get; set; }
    public string? Description { get; set; }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageSeasonTemplates, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageSeasonTemplates, token);
    }

    [ExcludeFromCodeCoverage]
    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.ManageSeasonTemplates, token);
    }
}

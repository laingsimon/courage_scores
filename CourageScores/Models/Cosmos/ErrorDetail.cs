using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos;

[ExcludeFromCodeCoverage]
public class ErrorDetail : AuditedEntity, IPermissionedEntity
{
    public SourceSystem Source { get; set; }
    public DateTime Time { get; set; }
    public string Message { get; set; } = null!;
    public string[]? Stack { get; set; }
    public string? Type { get; set; }
    public string? UserName { get; set; }
    public string? UserAgent { get; set; }
    public string? Url { get; set; }

    public Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(true);
    }

    public Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(false);
    }

    public Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(false);
    }
}

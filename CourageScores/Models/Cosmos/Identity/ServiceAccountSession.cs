using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Cosmos.Identity;

[ExcludeFromCodeCoverage]
public class ServiceAccountSession : AuditedEntity, IPermissionedEntity
{
    public required string ServiceIpAddress { get; set; }
    public required string ServiceUserAgent { get; set; }
    public required string VerificationValue { get; set; }
    public required string FriendlyName { get; set; }
    public DateTime? LastRequest { get; set; }
    public string? PinFromApprover { get; set; }
    public string? ApprovedBy { get; set; }
    public string? RejectedBy { get; set; }
    public string? Message { get; set; }
    public string? TransientUsername { get; set; }

    public Task<bool> CanCreate(IUserAccessService userAccess, CancellationToken token)
    {
        return Task.FromResult(true);
    }

    public async Task<bool> CanEdit(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.LoginServiceAccounts, token) || userAccess.User == null;
    }

    public async Task<bool> CanDelete(IUserAccessService userAccess, CancellationToken token)
    {
        return await userAccess.HasAccess(AccessOption.LoginServiceAccounts, token);
    }
}

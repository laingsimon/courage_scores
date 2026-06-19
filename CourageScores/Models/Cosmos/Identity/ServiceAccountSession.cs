using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

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

    public bool CanCreate(UserDto? user)
    {
        return true;
    }

    public bool CanEdit(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.LoginServiceAccounts == true || user == null;
#pragma warning restore CS0618 // Type or member is obsolete
    }

    public bool CanDelete(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.LoginServiceAccounts == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }
}

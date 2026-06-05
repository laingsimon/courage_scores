using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Identity;

public class ServiceAccountSession : AuditedEntity, IPermissionedEntity
{
    public required string ServiceIpAddress { get; set; }
    public required string ServiceUserAgent { get; set; }
    public required string PinHash { get; set; }
    public required string CookieValue { get; set; }
    public DateTime? LastRequest { get; set; }
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
        return user?.Access?.LoginServiceAccounts == true;
    }

    public bool CanDelete(UserDto? user)
    {
        return user?.Access?.LoginServiceAccounts == true;
    }
}

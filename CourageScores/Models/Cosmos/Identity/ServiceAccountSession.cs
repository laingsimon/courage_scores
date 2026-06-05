namespace CourageScores.Models.Cosmos.Identity;

public class ServiceAccountSession : AuditedEntity
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
}

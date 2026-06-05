namespace CourageScores.Models.Dtos.Identity;

public class ServiceAccountSessionDto : AuditedDto
{
    /// <summary>
    /// The ip address of the tablet/tv
    /// </summary>
    public required string ServiceIpAddress { get; set; }

    /// <summary>
    /// The user agent of the tablet/tv
    /// </summary>
    public required string ServiceUserAgent { get; set; }

    /// <summary>
    /// The hash of a pin held only on the tablet/tv when creating the session
    /// </summary>
    public required string PinHash { get; set; }

    /// <summary>
    /// A cookie-value to be set by the tablet/tv when creating the session
    /// This value should cycle periodically
    /// </summary>
    public required string CookieValue { get; set; }

    /// <summary>
    /// When the last api request was received by the signed-in user
    /// </summary>
    public DateTime? LastRequest { get; set; }

    /// <summary>
    /// Who approved the session
    /// </summary>
    public string? ApprovedBy { get; set; }

    /// <summary>
    /// Who rejected the session
    /// </summary>
    public string? RejectedBy { get; set; }

    /// <summary>
    /// The reason for the rejection
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// The name of the user that was created for this session
    /// </summary>
    public string? TransientUsername { get; set; }
}

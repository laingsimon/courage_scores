using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public class ServiceAccountSessionDto : AuditedDto, IIntegrityCheckDto
{
    public const string CookieName = "ServiceAccountSession";

    /// <summary>
    /// The ip address of the tablet/tv
    /// </summary>
    public required string ServiceIpAddress { get; init; }

    /// <summary>
    /// The ip address of the current request
    /// </summary>
    public string? MyIpAddress { get; set; }

    /// <summary>
    /// The user agent of the tablet/tv
    /// </summary>
    public required string ServiceUserAgent { get; init; }

    /// <summary>
    /// The pin entered by the approver, the tablet should send the pin when attempting to 'activate' the session
    /// This value must never be sent back to the client
    /// </summary>
    [JsonIgnore]
    public string? PinFromApprover { get; init; }

    /// <summary>
    /// A cookie-value to be set by the tablet/tv when creating the session
    /// This value should cycle periodically
    /// </summary>
    [JsonIgnore] // don't expose this either, it's for the tablet headers only
    public required string CookieValue { get; init; }

    /// <summary>
    /// When the last api request was received by the signed-in user
    /// </summary>
    public DateTime? LastRequest { get; init; }

    /// <summary>
    /// Who approved the session
    /// </summary>
    public string? ApprovedBy { get; init; }

    /// <summary>
    /// Who rejected the session
    /// </summary>
    public string? RejectedBy { get; init; }

    /// <summary>
    /// The reason for the rejection
    /// </summary>
    public string? Message { get; init; }

    /// <summary>
    /// The name of the user that was created for this session
    /// </summary>
    public string? TransientUsername { get; init; }

    public DateTime? LastUpdated { get; init; }
}

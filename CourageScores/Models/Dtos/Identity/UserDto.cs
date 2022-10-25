using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
#pragma warning disable CS8618
public class UserDto : AuditedDto
{
    /// <summary>
    /// The full name of the person
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// The given name of the person
    /// </summary>
    public string GivenName { get; set; }

    /// <summary>
    /// The email address for the person
    /// </summary>
    public string EmailAddress { get; set; }

    /// <summary>
    /// What access does this person have?
    /// </summary>
    public AccessDto? Access { get; set; }
}
#pragma warning restore CS8618

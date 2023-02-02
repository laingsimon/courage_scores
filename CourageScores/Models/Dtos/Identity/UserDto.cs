using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public class UserDto
{
    /// <summary>
    /// The full name of the person
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The given name of the person
    /// </summary>
    public string GivenName { get; set; } = null!;

    /// <summary>
    /// The email address for the person
    /// </summary>
    public string EmailAddress { get; set; } = null!;

    /// <summary>
    /// What access does this person have?
    /// </summary>
    public AccessDto? Access { get; set; }

    /// <summary>
    /// The identity of the team this user is attributed to, via their email address
    /// </summary>
    public Guid? TeamId { get; set; }
}

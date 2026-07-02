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
    /// What levels of access does this person have?
    /// </summary>
    public Dictionary<AccessOption, AccessLevelDto> AccessLevels { get; set; } = new();

    /// <summary>
    /// The identity of the team this user is attributed to, via their email address
    /// </summary>
    public Guid? TeamId { get; set; }

    /// <summary>
    /// Is this a transient user?
    /// </summary>
    public bool Transient { get; set; }
}

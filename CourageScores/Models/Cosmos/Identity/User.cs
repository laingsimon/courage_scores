using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Identity;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "AutoPropertyCanBeMadeGetOnly.Global")]
public class User : AuditedEntity
{
    public string Name { get; set; } = null!;

    public string GivenName { get; set; } = null!;

    public string EmailAddress { get; set; } = null!;

    /// <summary>
    /// What access does this user have?
    /// </summary>
    public Access? Access { get; set; }
}
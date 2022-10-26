using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Models.Cosmos.Identity;

[SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
[SuppressMessage("ReSharper", "AutoPropertyCanBeMadeGetOnly.Global")]
public class User
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string GivenName { get; set; } = null!;

    [JsonProperty("emailAddress")]
    public string EmailAddress { get; set; } = null!;

    /// <summary>
    /// What access does this user have?
    /// </summary>
    public Access? Access { get; set; }
}
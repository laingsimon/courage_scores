using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;
using Newtonsoft.Json;

namespace CourageScores.Models.Cosmos.Identity;

[ExcludeFromCodeCoverage]
public class User
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string GivenName { get; set; } = null!;

    [JsonProperty("emailAddress")]
    public string EmailAddress { get; set; } = null!;

    public Access? Access { get; set; } = new();

    public Dictionary<AccessOption, AccessLevel> AccessLevels { get; set; } = new();

    [JsonIgnore]
    public Guid? TeamId { get; set; }

    public bool Transient { get; set; }
}

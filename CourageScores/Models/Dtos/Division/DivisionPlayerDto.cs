using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionPlayerDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public int Rank { get; set; }
    public string Name { get; set; } = null!;
    public string Team { get; set; } = null!;
    [JsonProperty("Played")]
    public int PlayedSingles { get; set; }
    [JsonProperty("Won")]
    public int WonSingles { get; set; }
    [JsonProperty("Lost")]
    public int LostSingles { get; set; }
    public int Points { get; set; }
    public double WinPercentage { get; set; }
    public int OneEighties { get; set; }
    public int Over100Checkouts { get; set; }
    public bool Captain { get; set; }
    public Dictionary<DateTime, Guid> Fixtures { get; set; } = new();

    [JsonIgnore]
    public int PlayedPairs { get; set; }
    [JsonIgnore]
    public int WonPairs { get; set; }
    [JsonIgnore]
    public int DrawPairs { get; set; }
    [JsonIgnore]
    public int PlayedTriples { get; set; }
    [JsonIgnore]
    public int WonTriples { get; set; }
    [JsonIgnore]
    public int DrawTriples { get; set; }
}
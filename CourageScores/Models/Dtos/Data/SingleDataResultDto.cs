using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Data;

[ExcludeFromCodeCoverage]
public class SingleDataResultDto : AuditedDto
{
    [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
    public string? Name { get; set; }
    [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
    public DateTime? Date { get; set; }
    [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
    public Guid? DivisionId { get; set; }
    [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
    public Guid? SeasonId { get; set; }
}
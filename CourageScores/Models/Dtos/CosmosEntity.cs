using Newtonsoft.Json;

namespace CourageScores.Models.Dtos;

public class CosmosEntity
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    [JsonProperty("id")] // required to ensure the id property matches the partition key in Cosmos
    public Guid Id { get; set; }

    /// <summary>
    /// The version the entities data
    /// </summary>
    [JsonProperty("id")] // required to ensure the id property matches the partition key in Cosmos
    public int Version { get; set; }
}

using Newtonsoft.Json;

namespace CourageScores.Models.Cosmos;

public abstract class CosmosEntity
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    [JsonProperty("id")] // required to ensure the id property matches the partition key in Cosmos
    public Guid Id { get; set; }

    /// <summary>
    /// The version the entities data
    /// </summary>
    public int Version { get; set; }
}

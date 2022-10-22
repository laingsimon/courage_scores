namespace CourageScores.Models.Cosmos;

public abstract class AuditedEntity : CosmosEntity
{
    /// <summary>
    /// When was this entity created
    /// </summary>
    public DateTime Created { get; set; }

    /// <summary>
    /// Who created this entity
    /// </summary>
    public string Author { get; set; } = null!;

    /// <summary>
    /// When was this entity last edited
    /// </summary>
    public DateTime Updated { get; set; }

    /// <summary>
    /// Who last modified this entity
    /// </summary>
    public string Editor { get; set; } = null!;
}

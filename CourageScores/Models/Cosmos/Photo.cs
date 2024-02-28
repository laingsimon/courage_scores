namespace CourageScores.Models.Cosmos;

public class Photo : AuditedEntity
{
    /// <summary>
    /// i.e. the id of the fixture
    /// </summary>
    public Guid EntityId { get; set; }

    /// <summary>
    /// the id of the team, if available
    /// </summary>
    public Guid? TeamId { get; set; }

    /// <summary>
    /// The contents of the photo
    /// </summary>
    public byte[] PhotoBytes { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// The name of the file, if available
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// The type of the photo
    /// </summary>
    public string ContentType { get; set; } = null!;
}
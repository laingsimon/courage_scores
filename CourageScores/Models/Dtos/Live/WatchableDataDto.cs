namespace CourageScores.Models.Dtos.Live;

public class WatchableDataDto
{
    /// <summary>
    /// The id of the data entity to watch
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The url where the live updates can be monitored
    /// </summary>
    public string RelativeUrl { get; set; } = null!;

    /// <summary>
    /// The url where the live updates can be monitored
    /// </summary>
    public string? AbsoluteUrl { get; set; }

    /// <summary>
    /// The type of data entity to watch
    /// </summary>
    public LiveDataType DataType { get; set; }

    /// <summary>
    /// The time of the last update
    /// </summary>
    public DateTimeOffset LastUpdate { get; set; }

    /// <summary>
    /// The name of the user publishing updates
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// The method used to publish updates
    /// </summary>
    public PublicationMode PublicationMode { get; set; }
}
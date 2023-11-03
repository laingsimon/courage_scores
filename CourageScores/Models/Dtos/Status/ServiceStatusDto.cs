using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Status;

[ExcludeFromCodeCoverage]
public class ServiceStatusDto
{
    public enum SeasonStatusEnum
    {
        InSeason,
        OutOfSeason,
    }

    /// <summary>
    /// Can the API access the database
    /// </summary>
    public bool DatabaseAccess { get; set; }

    /// <summary>
    /// The status of the current season
    /// </summary>
    public SeasonStatusEnum? SeasonStatus { get; set; }

    /// <summary>
    /// The size of the memory cache
    /// </summary>
    public int? CachedEntries { get; set; }

    /// <summary>
    /// The time the api service started
    /// </summary>
    public DateTimeOffset StartTime { get; set; }

    /// <summary>
    /// The duration the api service has been running for
    /// </summary>
    public TimeSpan UpTime { get; set; }

    /// <summary>
    /// The number of open web sockets
    /// </summary>
    public int OpenSockets { get; set; }
}
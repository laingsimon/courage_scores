namespace CourageScores.Filters;

public class ScopedCacheManagementFlags
{
    public static readonly Guid EvictAll = Guid.Empty;

    /// <summary>
    /// Should the cache entries for division be evicted
    /// </summary>
    public Guid? EvictDivisionDataCacheForDivisionId { get; set; }

    /// <summary>
    /// Should the cache entries for season be evicted
    /// </summary>
    public Guid? EvictDivisionDataCacheForSeasonId { get; set; }
}
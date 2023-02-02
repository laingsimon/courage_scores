using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services.Division;

public class CachingDivisionService : ICachingDivisionService
{
    private readonly IDivisionService _divisionService;
    private readonly IMemoryCache _memoryCache;
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _accessor;
    private static readonly HashSet<CacheKey> CacheKeys = new HashSet<CacheKey>();

    public CachingDivisionService(IDivisionService divisionService, IMemoryCache memoryCache, IUserService userService, IHttpContextAccessor accessor)
    {
        _divisionService = divisionService;
        _memoryCache = memoryCache;
        _userService = userService;
        _accessor = accessor;
    }

    public Task InvalidateCaches(Guid? divisionId, Guid? seasonId)
    {
        if (divisionId == null && seasonId == null)
        {
            return Task.CompletedTask;
        }

        if (divisionId != null)
        {
            // invalidate caches where division id matches, any season id
            var keys = CacheKeys.Where(key => key.DivisionId == divisionId.Value).ToArray();
            InvalidateCaches(keys);
        }

        if (seasonId != null)
        {
            // invalidate caches where season id matches, any division id
            var keys = CacheKeys.Where(key => key.SeasonId == seasonId.Value).ToArray();
            InvalidateCaches(keys);
        }

        return Task.CompletedTask;
    }

    public async Task<DivisionDataDto> GetDivisionData(Guid? divisionId, Guid? seasonId, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user != null)
        {
            return await _divisionService.GetDivisionData(divisionId, seasonId, token);
        }

        var key = new CacheKey(divisionId, seasonId, "GetDivisionData");
        InvalidateCacheIfCacheControlHeaderPresent(key);
        CacheKeys.Add(key);
        return await _memoryCache.GetOrCreateAsync(key, _ => _divisionService.GetDivisionData(divisionId, seasonId, token));
    }

    public async Task<DivisionDto?> Get(Guid id, CancellationToken token)
    {
        var key = new CacheKey(id, null, "Get");
        InvalidateCacheIfCacheControlHeaderPresent(key);
        CacheKeys.Add(key);
        return await _memoryCache.GetOrCreateAsync(key, _ => _divisionService.Get(id, token));
    }

    private void InvalidateCacheIfCacheControlHeaderPresent(CacheKey key)
    {
        if (!CacheKeys.Contains(key))
        {
            return;
        }

        var request = _accessor.HttpContext?.Request;
        var noCacheHeaderPresent = request?.Headers.CacheControl.Contains("no-cache");
        if (noCacheHeaderPresent == true)
        {
            CacheKeys.Remove(key);
            _memoryCache.Remove(key);
        }
    }

    public async IAsyncEnumerable<DivisionDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        var key = new CacheKey(null, null, "Get");
        InvalidateCacheIfCacheControlHeaderPresent(key);
        CacheKeys.Add(key);

        foreach (var division in await _memoryCache.GetOrCreateAsync(key, async _ => await _divisionService.GetAll(token).ToList()))
        {
            yield return division;
        }
    }

    private void InvalidateCaches(Guid divisionId, string? type)
    {
        var cacheKeys = CacheKeys.Where(k => (k.DivisionId == divisionId || k.DivisionId == null) && (k.Type == type || type == null)).ToArray();
        InvalidateCaches(cacheKeys);
    }

    private void InvalidateCaches(IReadOnlyCollection<CacheKey> keys)
    {
        foreach (var key in keys)
        {
            _memoryCache.Remove(key);
            CacheKeys.Remove(key);
        }
    }

    public IAsyncEnumerable<DivisionDto> GetWhere(string query, CancellationToken token)
    {
        return _divisionService.GetWhere(query, token);
    }

    public Task<ActionResultDto<DivisionDto>> Upsert<TOut>(Guid id, IUpdateCommand<Models.Cosmos.Division, TOut> updateCommand, CancellationToken token)
    {
        try
        {
            return _divisionService.Upsert(id, updateCommand, token);
        }
        finally
        {
            InvalidateCaches(id, null);
        }
    }

    public Task<ActionResultDto<DivisionDto>> Delete(Guid id, CancellationToken token)
    {
        try
        {
            return _divisionService.Delete(id, token);
        }
        finally
        {
            InvalidateCaches(id, null);
        }
    }

    private class CacheKey : IEquatable<CacheKey>
    {
        public Guid? DivisionId { get; }
        public Guid? SeasonId { get; }
        public string Type { get; }

        public CacheKey(Guid? divisionId, Guid? seasonId, string type)
        {
            DivisionId = divisionId;
            SeasonId = seasonId;
            Type = type;
        }

        public bool Equals(CacheKey? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return Nullable.Equals(DivisionId, other.DivisionId) && Nullable.Equals(SeasonId, other.SeasonId) && Type == other.Type;
        }

        public override bool Equals(object? obj)
        {
            if (ReferenceEquals(null, obj)) return false;
            if (ReferenceEquals(this, obj)) return true;
            if (obj.GetType() != this.GetType()) return false;
            return Equals((CacheKey)obj);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(DivisionId, SeasonId, Type);
        }
    }
}
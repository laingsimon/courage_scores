using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services.Division;

public class CachingDivisionService : ICachingDivisionService
{
    private static readonly ConcurrentDictionary<DivisionDataCacheKey, object> CacheKeys = new();
    private readonly IHttpContextAccessor _accessor;
    private readonly IDivisionService _divisionService;
    private readonly IMemoryCache _memoryCache;
    private readonly IUserService _userService;

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
            var keys = CacheKeys.Keys.Where(key =>
                key.Filter.DivisionId == divisionId.Value ||
                divisionId == Guid.Empty && key.Filter.DivisionId != null).ToArray();
            InvalidateCaches(keys);
        }

        if (seasonId != null)
        {
            // invalidate caches where season id matches, any division id
            var keys = CacheKeys.Keys.Where(key =>
                    key.Filter.SeasonId == seasonId.Value || seasonId == Guid.Empty && key.Filter.SeasonId != null)
                .ToArray();
            InvalidateCaches(keys);
        }

        return Task.CompletedTask;
    }

    public async Task<DivisionDataDto> GetDivisionData(DivisionDataFilter filter, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user != null)
        {
            return await _divisionService.GetDivisionData(filter, token);
        }

        var key = new DivisionDataCacheKey(filter, "GetDivisionData");
        InvalidateCacheIfCacheControlHeaderPresent(key);
        CacheKeys.TryAdd(key, new object());
        return await _memoryCache.GetOrCreateAsync(key, _ => _divisionService.GetDivisionData(filter, token));
    }

    public async Task<DivisionDto?> Get(Guid id, CancellationToken token)
    {
        var key = new DivisionDataCacheKey(new DivisionDataFilter
        {
            DivisionId = id,
        }, "Get");
        InvalidateCacheIfCacheControlHeaderPresent(key);
        CacheKeys.TryAdd(key, new object());
        return await _memoryCache.GetOrCreateAsync(key, _ => _divisionService.Get(id, token));
    }

    public async IAsyncEnumerable<DivisionDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        var key = new DivisionDataCacheKey(new DivisionDataFilter(), "Get");
        InvalidateCacheIfCacheControlHeaderPresent(key);
        CacheKeys.TryAdd(key, new object());

        foreach (var division in await _memoryCache.GetOrCreateAsync(key, async _ => await _divisionService.GetAll(token).ToList()))
        {
            yield return division;
        }
    }

    public IAsyncEnumerable<DivisionDto> GetWhere(string query, CancellationToken token)
    {
        return _divisionService.GetWhere(query, token);
    }

    public Task<ActionResultDto<DivisionDto>> Upsert<TOut>(Guid? id,
        IUpdateCommand<Models.Cosmos.Division, TOut> updateCommand, CancellationToken token)
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

    private void InvalidateCacheIfCacheControlHeaderPresent(DivisionDataCacheKey key)
    {
        if (!CacheKeys.ContainsKey(key))
        {
            return;
        }

        var request = _accessor.HttpContext?.Request;
        var noCacheHeaderPresent = request?.Headers.CacheControl.Contains("no-cache");
        if (noCacheHeaderPresent == true)
        {
            CacheKeys.TryRemove(key, out _);
            _memoryCache.Remove(key);
        }
    }

    private void InvalidateCaches(Guid divisionId, string? type)
    {
        var cacheKeys = CacheKeys.Keys.Where(k =>
                (k.Filter.DivisionId == divisionId || k.Filter.DivisionId == null) && (k.Type == type || type == null))
            .ToArray();
        InvalidateCaches(cacheKeys);
    }

    private void InvalidateCaches(IReadOnlyCollection<DivisionDataCacheKey> keys)
    {
        foreach (var key in keys)
        {
            _memoryCache.Remove(key);
            CacheKeys.TryRemove(key, out _);
        }
    }
}
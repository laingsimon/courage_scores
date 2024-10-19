using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services;

public class InterceptingMemoryCache : ICache
{
    private readonly IMemoryCache _cache;
    private readonly ConcurrentDictionary<object, object> _keys = new ConcurrentDictionary<object, object>();

    public InterceptingMemoryCache(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void Dispose()
    {
        _cache.Dispose();
        _keys.Clear();
    }

    public ICacheEntry CreateEntry(object key)
    {
        var entry = _cache.CreateEntry(key);
        _keys.TryAdd(key, entry);
        return entry;
    }

    public void Remove(object key)
    {
        _cache.Remove(key);
        _keys.Remove(key, out _);
    }

    public bool TryGetValue(object key, out object value)
    {
        return _cache.TryGetValue(key, out value);
    }

    public IEnumerable<object> GetKeys()
    {
        return _keys.Keys.Where(key => _cache.TryGetValue(key, out _)).ToArray();
    }
}
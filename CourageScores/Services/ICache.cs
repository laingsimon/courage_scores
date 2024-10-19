using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services;

public interface ICache : IMemoryCache
{
    IEnumerable<object> GetKeys();
}
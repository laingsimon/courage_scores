using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services;

public class CachingDataService<TModel, TDto> : IGenericDataService<TModel, TDto>
    where TModel : AuditedEntity, IPermissionedEntity, new()
    where TDto : AuditedDto
{
    private readonly IGenericDataService<TModel, TDto> _underlyingService;
    private readonly IMemoryCache _memoryCache;
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _accessor;

    public CachingDataService(IGenericDataService<TModel, TDto> underlyingService, IMemoryCache memoryCache, IUserService userService, IHttpContextAccessor accessor)
    {
        _underlyingService = underlyingService;
        _memoryCache = memoryCache;
        _userService = userService;
        _accessor = accessor;
    }

    public Task<TDto?> Get(Guid id, CancellationToken token)
    {
        var key = new CacheKey(id, null);
        return CacheIfNotLoggedIn(key, () => _underlyingService.Get(id, token), token);
    }

    public async IAsyncEnumerable<TDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        var key = new CacheKey(null, null);
        foreach (var item in await CacheIfNotLoggedIn(key, () => _underlyingService.GetAll(token).ToList(), token))
        {
            yield return item;
        }
    }

    public async IAsyncEnumerable<TDto> GetWhere(string query, [EnumeratorCancellation] CancellationToken token)
    {
        var key = new CacheKey(null, query);
        foreach (var item in await CacheIfNotLoggedIn(key, () => _underlyingService.GetWhere(query, token).ToList(), token))
        {
            yield return item;
        }
    }

    public Task<ActionResultDto<TDto>> Upsert<TOut>(Guid id, IUpdateCommand<TModel, TOut> updateCommand, CancellationToken token)
    {
        InvalidateCaches(new[] { new CacheKey(id, null) });
        return _underlyingService.Upsert(id, updateCommand, token);
    }

    public Task<ActionResultDto<TDto>> Delete(Guid id, CancellationToken token)
    {
        InvalidateCaches(new[] { new CacheKey(id, null) });
        return _underlyingService.Delete(id, token);
    }

    protected async Task<T> CacheIfNotLoggedIn<T>(CacheKey key, Func<Task<T>> provider, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user != null)
        {
            return await provider();
        }

        if (IsNoCacheRequest())
        {
            InvalidateCaches(new[] { key });
        }
        return await _memoryCache.GetOrCreateAsync(key, _ => provider());
    }

    private bool IsNoCacheRequest()
    {
        var request = _accessor.HttpContext?.Request;
        return request?.Headers.CacheControl.Contains("no-cache") == true;
    }

    private void InvalidateCaches(IReadOnlyCollection<CacheKey> keys)
    {
        foreach (var key in keys)
        {
            _memoryCache.Remove(key);
        }
    }

    protected class CacheKey : IEquatable<CacheKey>
    {
        private readonly Guid? _id;
        private readonly string? _where;
        private readonly string _model;

        public CacheKey(Guid? id, string? where)
        {
            _id = id;
            _where = where;
            _model = typeof(TModel).Name;
        }

        public bool Equals(CacheKey? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return Nullable.Equals(_id, other._id) && _where == other._where && _model == other._model;
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
            return HashCode.Combine(_id, _where, _model);
        }
    }
}
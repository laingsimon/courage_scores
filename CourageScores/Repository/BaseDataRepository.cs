namespace CourageScores.Repository;

#pragma warning disable CS1998
public class BaseDataRepository<T>
{
    private readonly Func<T, Guid> _getId;
    private readonly Dictionary<Guid, T> _store = new Dictionary<Guid, T>();

    public BaseDataRepository(Func<T, Guid> getId)
    {
        _getId = getId;
    }

    public async Task<T> Get(Guid id)
    {
#pragma warning disable CS8603
        return _store.TryGetValue(id, out var item)
            ? item
            : default;
#pragma warning restore CS8603
    }

    public async IAsyncEnumerable<T> GetAll()
    {
        foreach (var item in _store.Values)
        {
            yield return item;
        }
    }

    public async Task Update(T item)
    {
        var id = _getId(item);
        _store[id] = item;
    }

    public async Task Create(T item)
    {
        await Update(item);
    }
}
#pragma warning restore CS1998

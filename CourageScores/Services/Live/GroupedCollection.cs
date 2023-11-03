using System.Collections;

namespace CourageScores.Services.Live;

/// <summary>
/// Will be registered as a singleton for the application
/// </summary>
public class GroupedCollection<T> : IGroupedCollection<T> where T : class
{
    private readonly Dictionary<Guid, HashSet<T>> _groups = new();

    public int Count => _groups.Sum(pair => pair.Value.Count);

    public void Add(Guid key, T item)
    {
        if (!_groups.TryGetValue(key, out var items))
        {
            items = new HashSet<T>();
            _groups.Add(key, items);
        }

        items.Add(item);
    }

    public void Remove(Guid key, T item)
    {
        if (_groups.TryGetValue(key, out var items))
        {
            items.Remove(item);
        }
    }

    public IReadOnlyCollection<T> GetItems(Guid key)
    {
        return _groups.TryGetValue(key, out var sockets)
            ? sockets.ToArray()
            : Array.Empty<T>();
    }

    #region IReadOnlyCollection members
    public IEnumerator<T> GetEnumerator()
    {
        return _groups.Values.SelectMany(items => items).GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
    #endregion
}
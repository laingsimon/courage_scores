using System.Collections;

namespace DataImport;

public class StatefulLookup<TKey, TValue> : IDictionary<TKey, TValue>
    where TKey : notnull
{
    private readonly Dictionary<TKey, TValue> _currentData;
    private readonly Dictionary<TKey, TValue> _newData = new Dictionary<TKey, TValue>();

    public StatefulLookup(Dictionary<TKey, TValue> currentData)
    {
        _currentData = currentData;
    }

    public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator()
    {
        return new CompositeEnumerator<KeyValuePair<TKey, TValue>>(_currentData.GetEnumerator(), _newData.GetEnumerator());
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }

    public void Add(KeyValuePair<TKey, TValue> item)
    {
        _newData.Add(item.Key, item.Value);
    }

    public void Clear()
    {
        _newData.Clear();
    }

    public bool Contains(KeyValuePair<TKey, TValue> item)
    {
        return _currentData.Contains(item) || _newData.Contains(item);
    }

    public void CopyTo(KeyValuePair<TKey, TValue>[] array, int arrayIndex)
    {
        throw new NotSupportedException();
    }

    public bool Remove(KeyValuePair<TKey, TValue> item)
    {
        return _newData.Remove(item.Key);
    }

    public int Count => _currentData.Count + _newData.Count;
    public bool IsReadOnly => false;
    public void Add(TKey key, TValue value)
    {
        _newData.Add(key, value);
    }

    public bool ContainsKey(TKey key)
    {
        return _currentData.ContainsKey(key) || _newData.ContainsKey(key);
    }

    public bool Remove(TKey key)
    {
        return _newData.Remove(key);
    }

    public bool TryGetValue(TKey key, out TValue value)
    {
        if (_currentData.TryGetValue(key, out var currentValue))
        {
            value = currentValue;
            return true;
        }

        if (_newData.TryGetValue(key, out var newValue))
        {
            value = newValue;
            return true;
        }

#pragma warning disable CS8601
        value = default;
#pragma warning restore CS8601
        return false;
    }

    public TValue this[TKey key]
    {
        get => _currentData.ContainsKey(key)
            ? _currentData[key]
            : _newData[key];
        set => _newData[key] = value;
    }

    public ICollection<TKey> Keys => _currentData.Keys.Concat(_newData.Keys).ToList();
    public ICollection<TValue> Values => _currentData.Values.Concat(_newData.Values).ToList();

    public void SetModified(TValue value)
    {
        var currentPair = _currentData.Where(pair => ReferenceEquals(pair.Value, value)).ToList();
        if (currentPair.Any())
        {
            _currentData.Remove(currentPair[0].Key);
            _newData.Add(currentPair[0].Key, value);
        }

        var newPair = _newData.Where(pair => ReferenceEquals(pair.Value, value)).ToList();
        if (!newPair.Any())
        {
            throw new InvalidOperationException("Item is not currently tracked, it must be added to the lookup");
        }
    }
}
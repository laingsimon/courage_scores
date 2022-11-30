namespace CourageScores.Services;

public static class AsyncEnumerableExtensions
{
    public static async Task<List<T>> ToList<T>(this IAsyncEnumerable<T> asyncEnumerable)
    {
        var items = new List<T>();

        await foreach (var item in asyncEnumerable)
        {
            items.Add(item);
        }

        return items;
    }

    public static async IAsyncEnumerable<T> WhereAsync<T>(this IAsyncEnumerable<T> asyncEnumerable,
        Predicate<T> predicate)
    {
        await foreach (var item in asyncEnumerable)
        {
            if (predicate(item))
            {
                yield return item;
            }
        }
    }

    public static async IAsyncEnumerable<TOut> SelectAsync<TIn, TOut>(this IAsyncEnumerable<TIn> asyncEnumerable,
        Func<TIn, TOut> selector)
    {
        await foreach (var item in asyncEnumerable)
        {
            yield return selector(item);
        }
    }

    public static async IAsyncEnumerable<TOut> SelectAsync<TIn, TOut>(this IEnumerable<TIn> enumerable,
        Func<TIn, Task<TOut>> selector)
    {
        foreach (var item in enumerable)
        {
            yield return await selector(item);
        }
    }

    public static async IAsyncEnumerable<TOut> SelectManyAsync<TIn, TOut>(this IAsyncEnumerable<TIn> asyncEnumerable,
        Func<TIn, IEnumerable<TOut>> selector)
    {
        await foreach (var item in asyncEnumerable)
        {
            foreach (var subItem in selector(item))
            {
                yield return subItem;
            }
        }
    }

    public static async IAsyncEnumerable<TOut> SelectAsync<TIn, TOut>(this IAsyncEnumerable<TIn> asyncEnumerable,
        Func<TIn, Task<TOut>> selector)
    {
        await foreach (var item in asyncEnumerable)
        {
            yield return await selector(item);
        }
    }

    public static async IAsyncEnumerable<T> OrderByAsync<T, TKey>(this IAsyncEnumerable<T> asyncEnumerable, Func<T, TKey> orderingSelector)
    {
        foreach (var item in (await asyncEnumerable.ToList()).OrderBy(orderingSelector))
        {
            yield return item;
        }
    }

    public static async IAsyncEnumerable<T> OrderByDescendingAsync<T, TKey>(this IAsyncEnumerable<T> asyncEnumerable, Func<T, TKey> orderingSelector)
    {
        foreach (var item in (await asyncEnumerable.ToList()).OrderByDescending(orderingSelector))
        {
            yield return item;
        }
    }

    public static async Task<T?> FirstOrDefaultAsync<T>(this IAsyncEnumerable<T> asyncEnumerable)
    {
        await foreach (var item in asyncEnumerable)
        {
            return item;
        }

        return default;
    }

    public static async Task<HashSet<T>> ToHashSetAsync<T>(this IAsyncEnumerable<T> asyncEnumerable)
    {
        var hashSet = new HashSet<T>();

        await foreach (var item in asyncEnumerable)
        {
            hashSet.Add(item);
        }

        return hashSet;
    }

    public static async Task<Dictionary<TKey, T>> ToDictionaryAsync<T, TKey>(
        this IAsyncEnumerable<T> asyncEnumerable, Func<T, TKey> keySelector) where TKey : notnull
    {
        return await asyncEnumerable.ToDictionaryAsync(keySelector, item => item);
    }

    public static async Task<Dictionary<TKey, TValue>> ToDictionaryAsync<T, TKey, TValue>(this IAsyncEnumerable<T> asyncEnumerable, Func<T, TKey> keySelector, Func<T, TValue> valueSelector)
        where TKey : notnull
    {
        var dict = new Dictionary<TKey, TValue>();

        await foreach (var item in asyncEnumerable)
        {
            dict.Add(keySelector(item), valueSelector(item));
        }

        return dict;
    }
}
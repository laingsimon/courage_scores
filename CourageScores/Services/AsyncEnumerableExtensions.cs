using System.Diagnostics;

namespace CourageScores.Services;

public static class AsyncEnumerableExtensions
{
    [DebuggerStepThrough]
    public static async Task<List<T>> ToList<T>(this IAsyncEnumerable<T> asyncEnumerable)
    {
        var items = new List<T>();

        await foreach (var item in asyncEnumerable)
        {
            items.Add(item);
        }

        return items;
    }

    [DebuggerStepThrough]
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

    [DebuggerStepThrough]
    public static async IAsyncEnumerable<TOut> SelectAsync<TIn, TOut>(this IAsyncEnumerable<TIn> asyncEnumerable,
        Func<TIn, TOut> selector)
    {
        await foreach (var item in asyncEnumerable)
        {
            yield return selector(item);
        }
    }

    [DebuggerStepThrough]
    public static async IAsyncEnumerable<TOut> SelectAsync<TIn, TOut>(this IEnumerable<TIn> enumerable,
        Func<TIn, Task<TOut>> selector)
    {
        foreach (var item in enumerable)
        {
            yield return await selector(item);
        }
    }

    [DebuggerStepThrough]
    public static async IAsyncEnumerable<TOut> SelectAsync<TIn, TOut>(this IAsyncEnumerable<TIn> asyncEnumerable,
        Func<TIn, Task<TOut>> selector)
    {
        await foreach (var item in asyncEnumerable)
        {
            yield return await selector(item);
        }
    }

    [DebuggerStepThrough]
    public static async IAsyncEnumerable<T> OrderByAsync<T, TKey>(this IAsyncEnumerable<T> asyncEnumerable, Func<T, TKey> orderingSelector)
    {
        foreach (var item in (await asyncEnumerable.ToList()).OrderBy(orderingSelector))
        {
            yield return item;
        }
    }

    [DebuggerStepThrough]
    public static async IAsyncEnumerable<T> OrderByDescendingAsync<T, TKey>(this IAsyncEnumerable<T> asyncEnumerable, Func<T, TKey> orderingSelector)
    {
        foreach (var item in (await asyncEnumerable.ToList()).OrderByDescending(orderingSelector))
        {
            yield return item;
        }
    }

    [DebuggerStepThrough]
    public static async IAsyncEnumerable<T> TakeAsync<T>(this IAsyncEnumerable<T> items, int take)
    {
        var count = 0;
        await foreach (var item in items)
        {
            if (count >= take)
            {
                yield break;
            }

            yield return item;
            count++;
        }
    }

    [DebuggerStepThrough]
    public static async Task<int> CountAsync<T>(this IAsyncEnumerable<T> items)
    {
        var count = 0;
        await foreach (var _ in items)
        {
            count++;
        }

        return count;
    }

    [DebuggerStepThrough]
    public static async Task<Dictionary<TKeyOut, TValueOut>> ToDictionaryAsync<TKeyIn, TValueIn, TKeyOut, TValueOut>(
        this IReadOnlyDictionary<TKeyIn, TValueIn> sourceDictionary,
        Func<TKeyIn, TKeyOut> keyTransform,
        Func<TValueIn, Task<TValueOut>> valueTransform)
        where TKeyOut: notnull
    {
        return new Dictionary<TKeyOut, TValueOut>(await sourceDictionary.SelectAsync(async pair =>
            new KeyValuePair<TKeyOut,TValueOut>(keyTransform(pair.Key), await valueTransform(pair.Value)))
            .ToList());
    }
}
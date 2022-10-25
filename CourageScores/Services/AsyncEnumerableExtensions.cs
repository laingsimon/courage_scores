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
}
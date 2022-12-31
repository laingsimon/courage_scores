namespace CourageScores.Tests;

public static class TestUtilities
{
    public static async IAsyncEnumerable<T> AsyncEnumerable<T>(params T[] items)
    {
        await Task.CompletedTask; // use await to ensure an AsyncEnumerable is created

        foreach (var item in items)
        {
            yield return item;
        }
    }
}
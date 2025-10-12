using CourageScores.Common;
using Microsoft.Azure.Cosmos;

namespace CourageScores.StubCosmos.Api;

public static class CosmosApiExtensions
{
    public static async IAsyncEnumerable<T> Enumerate<T>(this FeedIterator<T> feedIterator)
    {
        while (feedIterator.HasMoreResults)
        {
            foreach (var item in await feedIterator.ReadNextAsync())
            {
                yield return item;
            }
        }
    }

    public static async Task<IReadOnlyCollection<T>> ToList<T>(this FeedIterator<T> feedIterator)
    {
        return await feedIterator.Enumerate().ToList();
    }
}

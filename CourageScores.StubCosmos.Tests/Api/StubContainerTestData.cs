using CourageScores.StubCosmos.Api;
using Microsoft.Azure.Cosmos;

namespace CourageScores.StubCosmos.Tests.Api;

internal static class StubContainerTestData
{
    public static async Task AddRows(StubContainer container, TestRecord[] rows)
    {
        foreach (var row in rows)
        {
            await container.UpsertItemAsync(row);
        }
    }

    public static async IAsyncEnumerable<TestRecord> GetRows(FeedIterator<TestRecord> results)
    {
        while (results.HasMoreResults)
        {
            foreach (var row in await results.ReadNextAsync())
            {
                yield return row;
            }
        }
    }

    public static IEnumerable<TestRecord> GetData()
    {
        yield return new TestRecord {Name = "Simon", Email = "email@somewhere.com"};
        yield return new TestRecord {Age = 40, ShoeSize = -12};
        yield return new TestRecord {Weight = 10.5, Height = -6.2};
        yield return new TestRecord {Married = true, Retired = false};
        yield return new TestRecord {UserId = Guid.NewGuid(), PatientId = Guid.NewGuid()};
    }
}

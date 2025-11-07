using CourageScores.Common;
using CourageScores.Common.Cosmos;
using CourageScores.StubCosmos.Api;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.StubCosmos.Tests.Api;

[TestFixture]
public class StubCosmosDatabaseTests
{
    [Test]
    public async Task CreateContainerIfNotExistsAsync_GivenNewContainerName_CreatesContainer()
    {
        var database = new StubCosmosDatabase();

        var result = await database.CreateContainerIfNotExistsAsync("container", "id");

        Assert.That(result.Container, Is.Not.Null);
    }

    [Test]
    public async Task CreateContainerIfNotExistsAsync_GivenExistingContainerName_ReturnsSameContainer()
    {
        var database = new StubCosmosDatabase();
        var created = await database.CreateContainerIfNotExistsAsync("container", "id");

        var result = await database.CreateContainerIfNotExistsAsync("container", "id");

        Assert.That(result.Container, Is.SameAs(created.Container));
    }

    [Test]
    public async Task GetContainerQueryStreamIterator_GivenExistingContainers_ReturnsContainerDetails()
    {
        var database = new StubCosmosDatabase();
        await database.CreateContainerIfNotExistsAsync("container", "/id");

        var containers = database.GetContainerQueryStreamIterator();

        Assert.That(containers.HasMoreResults, Is.True);
        var container = await containers.ReadNextAsync();
        var containersContentJson = await new StreamReader(container.Content).ReadToEndAsync();
        var containersContent = JsonConvert.DeserializeObject<ContainerItemJson>(containersContentJson)!;
        Assert.That(containersContent.DocumentCollections.Count, Is.EqualTo(1));
        var containerDetail = containersContent.DocumentCollections[0];
        Assert.That(containerDetail.Id, Is.EqualTo("container"));
        Assert.That(containerDetail.PartitionKey.Paths, Is.EqualTo(["/id"]));
    }

    [Test]
    public async Task SnapshotsFunctionAsExpected()
    {
        var database = new StubCosmosDatabase();
        var container = (StubContainer)await database.CreateContainerIfNotExistsAsync("test", "/id");
        var expectedRecords = StubContainerTestData.GetData().ToArray();
        await StubContainerTestData.AddRows(container, expectedRecords);
        Assert.That(
            await StubContainerTestData.GetRows(container.GetItemQueryIterator<TestRecord>("select * from test")).ToList(),
            Is.EquivalentTo(expectedRecords));

        await database.CreateSnapshot("snapshot");
        container = (StubContainer)await database.CreateContainerIfNotExistsAsync("test", "/id");

        var replacementItem = expectedRecords[0] with
        {
            Name = "modified after snapshot",
        };
        await container.UpsertItemAsync(replacementItem);
        Assert.That(
            await StubContainerTestData.GetRows(container.GetItemQueryIterator<TestRecord>("select * from test")).ToList(),
            Has.One.Matches<TestRecord>(r => r.Id == replacementItem.Id && r.Name == replacementItem.Name));

        await database.ResetToSnapshot("snapshot");
        container = (StubContainer)await database.CreateContainerIfNotExistsAsync("test", "/id");

        Assert.That(
            await StubContainerTestData.GetRows(container.GetItemQueryIterator<TestRecord>("select * from test")).ToList(),
            Is.EquivalentTo(expectedRecords));

        await database.DeleteSnapshot("snapshot");
        await Assert.ThatAsync(
            () => database.ResetToSnapshot("snapshot"),
            Throws.TypeOf<ArgumentOutOfRangeException>());
    }
}

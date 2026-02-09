using CourageScores.Common;
using CourageScores.Repository;
using CourageScores.StubCosmos.Api;
using Microsoft.Azure.Cosmos;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Repository;

[TestFixture]
public class DataBrowserRepositoryTests
{
    private readonly CancellationToken _token = CancellationToken.None;

    [TestCase("name")]
    [TestCase("NAME")]
    public async Task TableExists_WhenContainerFound_ReturnsTrue(string name)
    {
        var database = new Mock<Database>();
        var container = new ContainerProperties
        {
            Id = "name",
        };
        var repository = new DataBrowserRepository<object>(database.Object);
        var iterator = new StubFeedIterator<ContainerProperties>(container);
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(iterator);

        var result = await repository.TableExists("name", _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task TableExists_WhenContainerNotFound_ReturnsFalse()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var iterator = new StubFeedIterator<ContainerProperties>();
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(iterator);

        var result = await repository.TableExists("name", _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task GetAll_WhenContainerNotFound_Throws()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var iterator = new StubFeedIterator<ContainerProperties>();
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(iterator);

        await Assert.ThatAsync(
            () => repository.GetAll("name", _token).ToList(),
            Throws.TypeOf<ArgumentOutOfRangeException>());
    }

    [Test]
    public async Task GetItem_WhenContainerNotFound_Throws()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var iterator = new StubFeedIterator<ContainerProperties>();
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(iterator);

        await Assert.ThatAsync(
            () => repository.GetItem("name", Guid.NewGuid(), _token),
            Throws.TypeOf<ArgumentOutOfRangeException>());
    }
}

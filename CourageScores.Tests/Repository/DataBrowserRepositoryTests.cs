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
        var containerIterator = new StubFeedIterator<ContainerProperties>(container);
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(containerIterator);

        var result = await repository.TableExists("name", _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task TableExists_WhenContainerNotFound_ReturnsFalse()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var containerIterator = new StubFeedIterator<ContainerProperties>();
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(containerIterator);

        var result = await repository.TableExists("name", _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task GetAll_WhenContainerNotFound_Throws()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var containerIterator = new StubFeedIterator<ContainerProperties>();
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(containerIterator);

        await Assert.ThatAsync(
            () => repository.GetAll("name", _token).ToList(),
            Throws.TypeOf<ArgumentOutOfRangeException>());
    }

    [TestCase("name ")]
    [TestCase("NAME")]
    public async Task GetAll_WhenContainerNameIsEqualButDifferentCase_ReturnsItems(string name)
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var containerIterator = new StubFeedIterator<ContainerProperties>(new ContainerProperties
        {
            Id = "name",
        });
        var container = new Mock<Container> { DefaultValue = DefaultValue.Mock };
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(containerIterator);
        database.Setup(d => d.GetContainer("name")).Returns(container.Object);

        await repository.GetAll(name, _token).ToList();

        database.Verify(d => d.GetContainer("name"));
    }

    [Test]
    public async Task GetItem_WhenContainerNotFound_Throws()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var containerIterator = new StubFeedIterator<ContainerProperties>();
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(containerIterator);

        await Assert.ThatAsync(
            () => repository.GetItem("name", Guid.NewGuid(), _token),
            Throws.TypeOf<ArgumentOutOfRangeException>());
    }

    [TestCase("name ")]
    [TestCase("NAME")]
    public async Task GetItem_WhenContainerNameIsEqualButDifferentCase_ReturnsItems(string name)
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);
        var containerIterator = new StubFeedIterator<ContainerProperties>(new ContainerProperties
        {
            Id = "name",
        });
        var container = new Mock<Container> { DefaultValue = DefaultValue.Mock };
        database
            .Setup(d => d.GetContainerQueryIterator<ContainerProperties>((string?)null, null, null))
            .Returns(containerIterator);
        database.Setup(d => d.GetContainer("name")).Returns(container.Object);

        await repository.GetItem(name, Guid.NewGuid(), _token);

        database.Verify(d => d.GetContainer("name"));
    }
}

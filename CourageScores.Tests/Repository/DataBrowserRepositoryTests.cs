using CourageScores.Repository;
using Microsoft.Azure.Cosmos;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Repository;

[TestFixture]
public class DataBrowserRepositoryTests
{
    [Test]
    public async Task TableExists_WhenContainerFound_ReturnsTrue()
    {
        var resolver = new Mock<ICosmosTableNameResolver>();
        var database = new Mock<Database>();
        var container = new Mock<Container>();
        var repository = new DataBrowserRepository<object>(database.Object, resolver.Object);
        database.Setup(d => d.GetContainer("name_suffix")).Returns(container.Object);
        resolver.Setup(r => r.GetTableName("name")).Returns("name_suffix");

        var result = await repository.TableExists("name");

        database.Verify(d => d.GetContainer("name_suffix"));
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task TableExists_WhenContainerNotFound_ReturnsFalse()
    {
        var resolver = new Mock<ICosmosTableNameResolver>();
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object, resolver.Object);
        resolver.Setup(r => r.GetTableName("name")).Returns("name_suffix");

        var result = await repository.TableExists("name");

        database.Verify(d => d.GetContainer("name_suffix"));
        Assert.That(result, Is.False);
    }
}
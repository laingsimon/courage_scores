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
        var database = new Mock<Database>();
        var container = new Mock<Container>();
        var repository = new DataBrowserRepository<object>(database.Object);
        database.Setup(d => d.GetContainer("name")).Returns(container.Object);

        var result = await repository.TableExists("name");

        database.Verify(d => d.GetContainer("name"));
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task TableExists_WhenContainerNotFound_ReturnsFalse()
    {
        var database = new Mock<Database>();
        var repository = new DataBrowserRepository<object>(database.Object);

        var result = await repository.TableExists("name");

        database.Verify(d => d.GetContainer("name"));
        Assert.That(result, Is.False);
    }
}
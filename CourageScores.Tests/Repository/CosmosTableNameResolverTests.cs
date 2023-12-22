using CourageScores.Repository;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Repository;

[TestFixture]
public class CosmosTableNameResolverTests
{
    private static readonly string? NullString = null;

    [Test]
    public void GetTableNameGeneric_GivenSuffix_ShouldAddSuffix()
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["TableNameSuffix"]).Returns("_suffix");
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableName<object>();

        Assert.That(result, Is.EqualTo("object_suffix"));
    }

    [Test]
    public void GetTableNameGeneric_GivenEmptySuffix_ShouldNotAddSuffix()
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["TableNameSuffix"]).Returns("");
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableName<object>();

        Assert.That(result, Is.EqualTo("object"));
    }

    [Test]
    public void GetTableNameGeneric_GivenNoSuffix_ShouldNotAddSuffix()
    {
        var config = new Mock<IConfiguration>();
#pragma warning disable CS8604
        config.Setup(c => c["TableNameSuffix"]).Returns(NullString);
#pragma warning restore CS8604
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableName<object>();

        Assert.That(result, Is.EqualTo("object"));
    }

    [Test]
    public void GetTableName_GivenSuffix_ShouldAddSuffix()
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["TableNameSuffix"]).Returns("_suffix");
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableName("OBJECT");

        Assert.That(result, Is.EqualTo("object_suffix"));
    }

    [Test]
    public void GetTableName_GivenEmptySuffix_ShouldNotAddSuffix()
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["TableNameSuffix"]).Returns("");
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableName("OBJECT");

        Assert.That(result, Is.EqualTo("object"));
    }

    [Test]
    public void GetTableName_GivenNoSuffix_ShouldNotAddSuffix()
    {
        var config = new Mock<IConfiguration>();
#pragma warning disable CS8604
        config.Setup(c => c["TableNameSuffix"]).Returns(NullString);
#pragma warning restore CS8604
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableName("OBJECT");

        Assert.That(result, Is.EqualTo("object"));
    }

    [Test]
    public void GetTableTypeName_GivenTableWithSuffix_ShouldReturnTableName()
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["TableNameSuffix"]).Returns("_suffix");
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableTypeName("object_suffix");

        Assert.That(result, Is.EqualTo("object"));
    }

    [Test]
    public void GetTableTypeName_GivenTableWithoutSuffix_ShouldReturnGivenName()
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["TableNameSuffix"]).Returns("_suffix");
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableTypeName("object_foo");

        Assert.That(result, Is.EqualTo("object_foo"));
    }

    [Test]
    public void GetTableTypeName_GivenNoConfiguredSuffix_ShouldReturnGivenName()
    {
        var config = new Mock<IConfiguration>();
#pragma warning disable CS8604
        config.Setup(c => c["TableNameSuffix"]).Returns(NullString);
#pragma warning restore CS8604
        var resolver = new CosmosTableNameResolver(config.Object);

        var result = resolver.GetTableTypeName("object_foo");

        Assert.That(result, Is.EqualTo("object_foo"));
    }
}
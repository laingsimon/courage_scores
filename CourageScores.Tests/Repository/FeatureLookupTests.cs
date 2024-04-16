using CourageScores.Repository;
using NUnit.Framework;

namespace CourageScores.Tests.Repository;

[TestFixture]
public class FeatureLookupTests
{
    private readonly FeatureLookup _lookup = new FeatureLookup();

    [Test]
    public void Get_GivenNonExistentFeatureId_ReturnsNull()
    {
        var result = _lookup.Get(Guid.NewGuid());

        Assert.That(result, Is.Null);
    }

    [Test]
    public void Get_GivenValidFeatureId_ReturnsFeature()
    {
        var result = _lookup.Get(_lookup.GetAll().First().Id);

        Assert.That(result, Is.Not.Null);
    }
}
using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataCacheKeyTests
{
    [Test]
    public void Equals_WhenOtherIsNull_ReturnsFalse()
    {
        var filter = new DivisionDataFilter();
        var key = new DivisionDataCacheKey(filter, "type", null, null);

        var result = key.Equals(null);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenOtherIsNotADivisionDataCacheKey_ReturnsFalse()
    {
        var filter = new DivisionDataFilter();
        var key = new DivisionDataCacheKey(filter, "type", null, null);

        var result = key.Equals(new object());

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenOtherIsReferenceEqual_ReturnsTrue()
    {
        var filter = new DivisionDataFilter();
        var key = new DivisionDataCacheKey(filter, "type", null, null);

        var result = key.Equals(key);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_WhenFilterIsDifferent_ReturnsFalse()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2002, 03, 04) };
        var key1 = new DivisionDataCacheKey(filter1, "type", null, null);
        var key2 = new DivisionDataCacheKey(filter2, "type", null, null);

        var result = key1.Equals(key2);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenTypeIsDifferent_ReturnsFalse()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var key1 = new DivisionDataCacheKey(filter1, "type1", null, null);
        var key2 = new DivisionDataCacheKey(filter2, "type2", null, null);

        var result = key1.Equals(key2);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenFilterAndTypeAreEqual_ReturnsTrue()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var key1 = new DivisionDataCacheKey(filter1, "type", null, null);
        var key2 = new DivisionDataCacheKey(filter2, "type", null, null);

        var result = key1.Equals(key2);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_WhenOnlyUrlsAreDifferent_ReturnsTrue()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var key1 = new DivisionDataCacheKey(filter1, "type", "a", "c");
        var key2 = new DivisionDataCacheKey(filter2, "type", "b", "d");

        var result = key1.Equals(key2);

        Assert.That(result, Is.True);
    }

    [Test]
    public void GetHashCode_GivenDifferentFilters_ReturnsDifferentHashCodes()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2002, 03, 04) };
        var key1 = new DivisionDataCacheKey(filter1, "type", null, null);
        var key2 = new DivisionDataCacheKey(filter2, "type", null, null);

        var result = key1.GetHashCode();

        Assert.That(result, Is.Not.EqualTo(key2.GetHashCode()));
    }

    [Test]
    public void GetHashCode_GivenDifferentTypes_ReturnsDifferentHashCodes()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var key1 = new DivisionDataCacheKey(filter1, "type1", null, null);
        var key2 = new DivisionDataCacheKey(filter2, "type2", null, null);

        var result = key1.GetHashCode();

        Assert.That(result, Is.Not.EqualTo(key2.GetHashCode()));
    }

    [Test]
    public void GetHashCode_GivenSameFilterAndType_ReturnsSameHashCode()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var key1 = new DivisionDataCacheKey(filter1, "type", null, null);
        var key2 = new DivisionDataCacheKey(filter2, "type", null, null);

        var result = key1.GetHashCode();

        Assert.That(result, Is.EqualTo(key2.GetHashCode()));
    }

    [Test]
    public void GetHashCode_WhenOnlyUrlsAreDifferent_ReturnsSameHashCode()
    {
        var filter1 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var filter2 = new DivisionDataFilter { Date = new DateTime(2001, 02, 03) };
        var key1 = new DivisionDataCacheKey(filter1, "type", "a", "c");
        var key2 = new DivisionDataCacheKey(filter2, "type", "b", "d");

        var result = key1.GetHashCode();

        Assert.That(result, Is.EqualTo(key2.GetHashCode()));
    }
}
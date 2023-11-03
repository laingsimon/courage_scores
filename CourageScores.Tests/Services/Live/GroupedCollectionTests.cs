using CourageScores.Services.Live;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class GroupedCollectionTests
{
    [Test]
    public void Count_WhenEmpty_Returns0()
    {
        var collection = new GroupedCollection<string>();

        var count = collection.Count;

        Assert.That(count, Is.EqualTo(0));
    }

    [Test]
    public void Count_WhenItemsExist_ReturnsCorrectCount()
    {
        var key1 = Guid.NewGuid();
        var key2 = Guid.NewGuid();
        var collection = new GroupedCollection<string>
        {
            { key1, "1" },
            { key1, "2" },
            { key2, "3" },
        };

        var count = collection.Count;

        Assert.That(count, Is.EqualTo(3));
    }

    [Test]
    public void GetEnumerator_WhenEmpty_ReturnsEmptyEnumerable()
    {
        var collection = new GroupedCollection<string>();

        var items = collection.ToArray();

        Assert.That(items, Is.Empty);
    }

    [Test]
    public void GetEnumerator_WhenItemsExist_ReturnsAllItems()
    {
        var collection = new GroupedCollection<string>
        {
            { Guid.NewGuid(), "1" },
            { Guid.NewGuid(), "2" },
            { Guid.NewGuid(), "3" },
        };

        var items = collection.ToArray();

        Assert.That(items, Is.EquivalentTo(new[] { "1", "2", "3" }));
    }

    [Test]
    public void Remove_WhenItemExists_RemovesItem()
    {
        var key1 = Guid.NewGuid();
        var key2 = Guid.NewGuid();
        var collection = new GroupedCollection<string>
        {
            { key1, "remove" },
            { key2, "keep" },
        };

        collection.Remove(key1, "remove");

        Assert.That(collection, Is.EquivalentTo(new[] { "keep" }));
    }

    [Test]
    public void Remove_WhenItemDoesNotExist_RemovesNothing()
    {
        var key = Guid.NewGuid();
        var collection = new GroupedCollection<string>
        {
            { key, "keep" },
        };

        collection.Remove(key, "remove");

        Assert.That(collection, Is.EquivalentTo(new[] { "keep" }));
    }

    [Test]
    public void GetItems_WhenNoItemsExistForKey_ReturnsEmpty()
    {
        var collection = new GroupedCollection<string>();

        var items = collection.GetItems(Guid.NewGuid());

        Assert.That(items, Is.Empty);
    }

    [Test]
    public void GetItems_WhenItemsExistForKey_ReturnsItemsForKey()
    {
        var key = Guid.NewGuid();
        var collection = new GroupedCollection<string>
        {
            { key, "1" },
            { Guid.NewGuid(), "another" },
        };

        var items = collection.GetItems(key);

        Assert.That(items, Is.EquivalentTo(new[] { "1" }));
    }

    [Test]
    public void GetItems_WhenItemAdded_ReturnedCollectionDoesNotChange()
    {
        var key = Guid.NewGuid();
        var collection = new GroupedCollection<string>
        {
            { key, "1" },
        };

        var items = collection.GetItems(key);
        collection.Add(key, "2");

        Assert.That(items, Is.EquivalentTo(new[] { "1" }));
    }
}
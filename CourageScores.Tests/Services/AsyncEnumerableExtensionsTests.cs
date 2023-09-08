using CourageScores.Services;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class AsyncEnumerableExtensionsTests
{
    [Test]
    public async Task ToList_GivenAsyncEnumerable_ReturnsListOfItems()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result, Is.EquivalentTo(new[]
        {
            itemB, itemA,
        }));
    }

    [Test]
    public async Task WhereAsync_GivenAsyncEnumerable_ReturnsMatchingItems()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.WhereAsync(x => x.Name == "a").ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result, Is.EquivalentTo(new[]
        {
            itemA,
        }));
    }

    [Test]
    public async Task SelectAsync_GivenAsyncEnumerableAndSyncMapper_MapsItemsCorrectly()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.SelectAsync(x => x.Name.ToUpper()).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result, Is.EquivalentTo(new[]
        {
            "A", "B",
        }));
    }

    [Test]
    public async Task SelectAsync_GivenAsyncEnumerableAndAsyncMapper_MapsItemsCorrectly()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.SelectAsync(NameToUpper).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result, Is.EquivalentTo(new[]
        {
            "A", "B",
        }));
    }

    [Test]
    public async Task SelectAsync_GivenEnumerableAndAsyncMapper_MapsItemsCorrectly()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = new[]
        {
            itemA, itemB,
        };

        var result = await items.SelectAsync(NameToUpper).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result, Is.EquivalentTo(new[]
        {
            "A", "B",
        }));
    }

    [Test]
    public async Task OrderByAsync_GivenAsyncEnumerable_ReturnsItemsOrderedCorrectly()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemB, itemA);

        var result = await items.OrderByAsync(x => x.Name).ToList();

        Assert.That(result, Is.EqualTo(new[]
        {
            itemA, itemB,
        }));
    }

    [Test]
    public async Task OrderByDescendingAsync_GivenAsyncEnumerable_ReturnsItemsOrderedCorrectly()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.OrderByDescendingAsync(x => x.Name).ToList();

        Assert.That(result, Is.EqualTo(new[]
        {
            itemB, itemA,
        }));
    }

    [Test]
    public async Task TakeAsync_GivenEmptyAsyncEnumerable_ReturnsCorrectNumberOfItems()
    {
        var items = TestUtilities.AsyncEnumerable<Item>();

        var result = await items.TakeAsync(1).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(0));
    }

    [Test]
    public async Task TakeAsync_GivenAsyncEnumerable_ReturnsCorrectNumberOfItems()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.TakeAsync(1).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result, Is.EqualTo(new[]
        {
            itemA,
        }));
    }

    [Test]
    public async Task CountAsync_GivenEmptyAsyncEnumerable_ReturnsCorrectCount()
    {
        var items = TestUtilities.AsyncEnumerable<Item>();

        var result = await items.CountAsync();

        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task CountAsync_GivenAsyncEnumerable_ReturnsCorrectCount()
    {
        var itemA = new Item
        {
            Name = "a",
        };
        var itemB = new Item
        {
            Name = "b",
        };
        var items = TestUtilities.AsyncEnumerable(itemA, itemB);

        var result = await items.CountAsync();

        Assert.That(result, Is.EqualTo(2));
    }

    private class Item
    {
        public string Name { get; init; } = null!;
    }

    private static Task<string> NameToUpper(Item item)
    {
        return Task.FromResult(item.Name.ToUpper());
    }
}
using System.Net.WebSockets;
using CourageScores.Services.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class WebSocketCollectionTests
{
    [Test]
    public void Count_WhenEmpty_Returns0()
    {
        var collection = new WebSocketCollection();

        var count = collection.Count;

        Assert.That(count, Is.EqualTo(0));
    }

    [Test]
    public void Count_WhenSocketsExist_ReturnsCorrectCount()
    {
        var saygId1 = Guid.NewGuid();
        var saygId2 = Guid.NewGuid();
        var collection = new WebSocketCollection
        {
            { saygId1, new ClientWebSocket() },
            { saygId1, new ClientWebSocket() },
            { saygId2, new ClientWebSocket() },
        };

        var count = collection.Count;

        Assert.That(count, Is.EqualTo(3));
    }

    [Test]
    public void GetEnumerator_WhenEmpty_ReturnsEmptyEnumerable()
    {
        var collection = new WebSocketCollection();

        var items = collection.ToArray();

        Assert.That(items, Is.Empty);
    }

    [Test]
    public void GetEnumerator_WhenSocketsExist_ReturnsAllSockets()
    {
        var socket1 = new ClientWebSocket();
        var socket2 = new ClientWebSocket();
        var socket3 = new ClientWebSocket();
        var collection = new WebSocketCollection
        {
            { Guid.NewGuid(), socket1 },
            { Guid.NewGuid(), socket2 },
            { Guid.NewGuid(), socket3 },
        };

        var items = collection.ToArray();

        Assert.That(items, Is.EquivalentTo(new[] { socket1, socket2, socket3 }));
    }

    [Test]
    public void Remove_WhenSocketExists_RemovesSocket()
    {
        var saygId1 = Guid.NewGuid();
        var saygId2 = Guid.NewGuid();
        var socketToRemove = new ClientWebSocket();
        var socketToKeep = new ClientWebSocket();
        var collection = new WebSocketCollection
        {
            { saygId1, socketToRemove },
            { saygId2, socketToKeep },
        };

        collection.Remove(socketToRemove);

        Assert.That(collection, Is.EquivalentTo(new[] { socketToKeep }));
    }

    [Test]
    public void Remove_WhenSocketDoesNotExist_RemovesNothing()
    {
        var saygId2 = Guid.NewGuid();
        var socketToRemove = new ClientWebSocket();
        var socketToKeep = new ClientWebSocket();
        var collection = new WebSocketCollection
        {
            { saygId2, socketToKeep },
        };

        collection.Remove(socketToRemove);

        Assert.That(collection, Is.EquivalentTo(new[] { socketToKeep }));
    }

    [Test]
    public void GetSockets_WhenNoSocketsExistForId_ReturnsEmpty()
    {
        var collection = new WebSocketCollection();

        var sockets = collection.GetSockets(Guid.NewGuid());

        Assert.That(sockets, Is.Empty);
    }

    [Test]
    public void GetSockets_WhenSocketsExistForId_ReturnsSocketsForId()
    {
        var saygId1 = Guid.NewGuid();
        var socketForId = new ClientWebSocket();
        var anotherSocket = new ClientWebSocket();
        var collection = new WebSocketCollection
        {
            { saygId1, socketForId },
            { Guid.NewGuid(), anotherSocket },
        };

        var sockets = collection.GetSockets(saygId1);

        Assert.That(sockets, Is.EquivalentTo(new[] { socketForId }));
    }

    [Test]
    public void GetSockets_WhenSocketAdded_ReturnedCollectionDoesNotChange()
    {
        var saygId1 = Guid.NewGuid();
        var socketForId = new ClientWebSocket();
        var collection = new WebSocketCollection
        {
            { saygId1, socketForId },
        };

        var sockets = collection.GetSockets(saygId1);
        collection.Add(saygId1, new ClientWebSocket());

        Assert.That(sockets, Is.EquivalentTo(new[] { socketForId }));
    }
}
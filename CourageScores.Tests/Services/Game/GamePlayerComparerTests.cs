using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GamePlayerComparerTests
{
    private readonly GamePlayerComparer _comparer = new GamePlayerComparer();

    [Test]
    public void Equals_GivenEmptyList_ReturnsTrue()
    {
        var result = _comparer.Equals(Array.Empty<GamePlayer>(), Array.Empty<GamePlayer>());

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameItemsInSameOrder_ReturnsTrue()
    {
        var x = new[] { CreatePlayer("1"), CreatePlayer("2") };
        var y = new[] { CreatePlayer("1"), CreatePlayer("2") };

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameItemsInDifferentOrder_ReturnsTrue()
    {
        var x = new[] { CreatePlayer("2"), CreatePlayer("1") };
        var y = new[] { CreatePlayer("1"), CreatePlayer("2") };

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenDifferentItems_ReturnsFalse()
    {
        var x = new[] { CreatePlayer("2"), CreatePlayer("1") };
        var y = new[] { CreatePlayer("3"), CreatePlayer("4") };

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentIds_ReturnsFalse()
    {
        var x = CreatePlayer();
        var y = CreatePlayer();
        x.Id = Guid.NewGuid();
        y.Id = Guid.NewGuid();

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentNames_ReturnsFalse()
    {
        var x = CreatePlayer();
        var y = CreatePlayer();
        x.Name = "AA";
        y.Name = "BB";

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenNullItemInX_ReturnsFalse()
    {
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
        var x = new GamePlayer[] { null };
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.
        var y = new[] { CreatePlayer() };

#pragma warning disable CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.
        var result = _comparer.Equals(x, y);
#pragma warning restore CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenNullItemInY_ReturnsFalse()
    {
        var x = new[] { CreatePlayer() };
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
        var y = new GamePlayer[] { null };
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.

#pragma warning disable CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.
        var result = _comparer.Equals(x, y);
#pragma warning restore CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenOnlyNullItems_ReturnsTrue()
    {
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
        var x = new GamePlayer[] { null };
        var y = new GamePlayer[] { null };
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameNamesExceptForWhitespace_ReturnsTrue()
    {
        var x = CreatePlayer();
        var y = CreatePlayer();
        x.Name = "AA  ";
        y.Name = "AA ";

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameNamesExceptForCase_ReturnsTrue()
    {
        var x = CreatePlayer();
        var y = CreatePlayer();
        x.Name = "aa";
        y.Name = "AA";

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSamePlayerProperties_ReturnsTrue()
    {
        var x = CreatePlayer();
        var y = CreatePlayer();

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void GetHashCode_GivenSamePlayerProperties_ReturnsSameHashCode()
    {
        var x = CreatePlayer();
        var y = CreatePlayer();

        var hashCodeX = _comparer.GetHashCode(x);
        var hashCodeY = _comparer.GetHashCode(y);

        Assert.That(hashCodeY, Is.EqualTo(hashCodeX));
    }

    [Test]
    public void GetHashCode_GivenEmptyList_Returns0()
    {
        var hashCode = _comparer.GetHashCode(Array.Empty<NotablePlayer>());

        Assert.That(hashCode, Is.EqualTo(0));
    }

    private static GamePlayer CreatePlayer(string name = "PLAYER")
    {
        return new GamePlayer
        {
            Id = Guid.Parse("32DD0C64-98D7-4704-9CED-A7310F751BC2"),
            Name = name,
        };
    }
}
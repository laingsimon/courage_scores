using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GameMatchOptionComparerTests
{
    private readonly GameMatchOptionComparer _comparer = new GameMatchOptionComparer();

    [Test]
    public void Equals_WhenGivenBothNull_ReturnsTrue()
    {
        var result = _comparer.Equals(null, null);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_WhenFirstIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(null, new GameMatchOption());

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenSecondIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(new GameMatchOption(), null);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentStartingScores_ReturnsFalse()
    {
        var x = CreateMatchOption();
        var y = CreateMatchOption();
        x.StartingScore = 501;
        y.StartingScore = 601;

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentNumberOfLegs_ReturnsFalse()
    {
        var x = CreateMatchOption();
        var y = CreateMatchOption();
        x.NumberOfLegs = 5;
        y.NumberOfLegs = 3;

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentPlayerCounts_ReturnsFalse()
    {
        var x = CreateMatchOption();
        var y = CreateMatchOption();
        x.PlayerCount = 2;
        y.PlayerCount = 1;

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenSameMatchOptions_ReturnsTrue()
    {
        var x = CreateMatchOption();
        var y = CreateMatchOption();

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void GetHashCode_GivenSameMatchOptions_ReturnsSameHashCode()
    {
        var x = CreateMatchOption();
        var y = CreateMatchOption();

        var hashCodeX = _comparer.GetHashCode(x);
        var hashCodeY = _comparer.GetHashCode(y);

        Assert.That(hashCodeX, Is.EqualTo(hashCodeY));
    }

    [Test]
    public void GetHashCode_GivenNull_Returns0()
    {
        var hashCode = _comparer.GetHashCode(null);

        Assert.That(hashCode, Is.EqualTo(0));
    }

    private static GameMatchOption CreateMatchOption()
    {
        return new GameMatchOption
        {
            PlayerCount = 1,
            StartingScore = 501,
            NumberOfLegs = 3,
        };
    }
}
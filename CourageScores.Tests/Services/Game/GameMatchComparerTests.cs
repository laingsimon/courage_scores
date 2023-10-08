using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GameMatchComparerTests
{
    private GameMatchComparer _comparer = null!;
    private Mock<IEqualityComparer<ICollection<GamePlayer>>> _playerComparer = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _playerComparer = new Mock<IEqualityComparer<ICollection<GamePlayer>>>();

        _comparer = new GameMatchComparer(_playerComparer.Object);
    }

    [Test]
    public void Equals_WhenGivenBothNull_ReturnsTrue()
    {
        var result = _comparer.Equals(null, null);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_WhenFirstIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(null, new GameMatch());

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenSecondIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(new GameMatch(), null);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentHomeScores_ReturnsFalse()
    {
        var x = CreateMatch();
        var y = CreateMatch();
        x.HomeScore = 1;
        y.HomeScore = 2;
        _playerComparer.Setup(c => c.Equals(x.HomePlayers, y.HomePlayers)).Returns(true);
        _playerComparer.Setup(c => c.Equals(x.AwayPlayers, y.AwayPlayers)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);

    }

    [Test]
    public void Equals_GivenDifferentAwayScores_ReturnsFalse()
    {
        var x = CreateMatch();
        var y = CreateMatch();
        x.AwayScore = 1;
        y.AwayScore = 2;
        _playerComparer.Setup(c => c.Equals(x.HomePlayers, y.HomePlayers)).Returns(true);
        _playerComparer.Setup(c => c.Equals(x.AwayPlayers, y.AwayPlayers)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentHomePlayers_ReturnsFalse()
    {
        var x = CreateMatch();
        var y = CreateMatch();
        _playerComparer.Setup(c => c.Equals(x.HomePlayers, y.HomePlayers)).Returns(false);
        _playerComparer.Setup(c => c.Equals(x.AwayPlayers, y.AwayPlayers)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentAwayPlayers_ReturnsFalse()
    {
        var x = CreateMatch();
        var y = CreateMatch();
        _playerComparer.Setup(c => c.Equals(x.HomePlayers, y.HomePlayers)).Returns(true);
        _playerComparer.Setup(c => c.Equals(x.AwayPlayers, y.AwayPlayers)).Returns(false);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenSameMatch_ReturnsTrue()
    {
        var x = CreateMatch();
        var y = CreateMatch();
        _playerComparer.Setup(c => c.Equals(x.HomePlayers, y.HomePlayers)).Returns(true);
        _playerComparer.Setup(c => c.Equals(x.AwayPlayers, y.AwayPlayers)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameMatch_ReturnsSameHashCode()
    {
        var x = CreateMatch();
        var y = CreateMatch();

        var hashCodeX = _comparer.GetHashCode(x);
        var hashCodeY = _comparer.GetHashCode(y);

        Assert.That(hashCodeX, Is.EqualTo(hashCodeY));
    }

    private static GameMatch CreateMatch()
    {
        return new GameMatch
        {
            HomePlayers =
            {
                new GamePlayer
                {
                    Id = Guid.Parse("32DD0C64-98D7-4704-9CED-A7310F751BC2"),
                    Name = "HOME PLAYER",
                },
            },
            AwayPlayers =
            {
                new GamePlayer
                {
                    Id = Guid.Parse("C9A104C3-5D05-4F73-BA33-0BC1843132CE"),
                    Name = "AWAY PLAYER",
                },
            },
            HomeScore = 2,
            AwayScore = 1,
        };
    }
}
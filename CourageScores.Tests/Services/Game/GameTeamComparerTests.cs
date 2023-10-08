using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GameTeamComparerTests
{
    private readonly GameTeamComparer _comparer = new GameTeamComparer();

    [Test]
    public void Equals_WhenGivenBothNull_ReturnsTrue()
    {
        var result = _comparer.Equals(null, null);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_WhenFirstIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(null, new GameTeam());

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenSecondIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(new GameTeam(), null);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentIds_ReturnsFalse()
    {
        var x = CreateTeam();
        var y = CreateTeam();
        x.Id = Guid.NewGuid();
        y.Id = Guid.NewGuid();

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenDifferentNames_ReturnsFalse()
    {
        var x = CreateTeam();
        var y = CreateTeam();
        x.Name = "A";
        y.Name = "B";

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_GivenSameTeamNameExceptForWhitespace_ReturnsTrue()
    {
        var x = CreateTeam();
        var y = CreateTeam();
        x.Name = "A  ";
        y.Name = "A ";

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameTeamNameExceptForCase_ReturnsTrue()
    {
        var x = CreateTeam();
        var y = CreateTeam();
        x.Name = "A";
        y.Name = "a";

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameTeam_ReturnsTrue()
    {
        var x = CreateTeam();
        var y = CreateTeam();

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void Equals_GivenSameTeam_ReturnsSameHashCode()
    {
        var x = CreateTeam();
        var y = CreateTeam();

        var hashCodeX = _comparer.GetHashCode(x);
        var hashCodeY = _comparer.GetHashCode(y);

        Assert.That(hashCodeX, Is.EqualTo(hashCodeY));
    }

    private static GameTeam CreateTeam()
    {
        return new GameTeam
        {
            Id = Guid.Parse("6FDBB4C8-5050-468C-B6AA-EA8C6CF7244D"),
            Name = "HOME",
            ManOfTheMatch = Guid.Parse("589DF698-3E0F-4A0E-949C-73995A1302CE"),
        };
    }
}
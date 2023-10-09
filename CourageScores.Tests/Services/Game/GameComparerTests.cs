using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Game;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GameComparerTests
{
    private GameComparer _comparer = null!;
    private Mock<IEqualityComparer<GameTeam>> _teamComparer = null!;
    private Mock<IEqualityComparer<GameMatch>> _matchComparer = null!;
    private Mock<IEqualityComparer<GameMatchOption?>> _matchOptionComparer = null!;
    private Mock<IEqualityComparer<ICollection<GamePlayer>>> _oneEightiesComparer = null!;
    private Mock<IEqualityComparer<ICollection<NotablePlayer>>> _hiChecksComparer = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _teamComparer = new Mock<IEqualityComparer<GameTeam>>();
        _matchComparer = new Mock<IEqualityComparer<GameMatch>>();
        _matchOptionComparer = new Mock<IEqualityComparer<GameMatchOption?>>();
        _oneEightiesComparer = new Mock<IEqualityComparer<ICollection<GamePlayer>>>();
        _hiChecksComparer = new Mock<IEqualityComparer<ICollection<NotablePlayer>>>();

        _comparer = new GameComparer(
            _teamComparer.Object,
            _matchComparer.Object,
            _matchOptionComparer.Object,
            _oneEightiesComparer.Object,
            _hiChecksComparer.Object);
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
        var result = _comparer.Equals(null, new CosmosGame());

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenSecondIsNull_ReturnsFalse()
    {
        var result = _comparer.Equals(new CosmosGame(), null);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenIdsAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        x.Id = Guid.NewGuid();
        y.Id = Guid.NewGuid();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenDatesAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        x.Date = DateTime.Today;
        y.Date = DateTime.Today.AddDays(1);
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenDivisionsAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        x.DivisionId = Guid.NewGuid();
        y.DivisionId = Guid.NewGuid();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenSeasonsAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        x.SeasonId = Guid.NewGuid();
        y.SeasonId = Guid.NewGuid();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenHomeTeamsAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(false);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenAwayTeamsAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(false);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenMatchesAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(false);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenMatchOptionsAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(false);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_When180sAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(false);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenHiChecksAreDifferent_ReturnsFalse()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(false);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.False);
    }

    [Test]
    public void Equals_WhenEverythingEqual_ReturnsTrue()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var result = _comparer.Equals(x, y);

        Assert.That(result, Is.True);
    }

    [Test]
    public void GetHashCode_WhenEverythingEqual_ReturnsSameHashCode()
    {
        var x = CreateGame();
        var y = CreateGame();
        _teamComparer.Setup(c => c.Equals(x.Home, y.Home)).Returns(true);
        _teamComparer.Setup(c => c.Equals(x.Away, y.Away)).Returns(true);
        _matchComparer.Setup(c => c.Equals(x.Matches[0], y.Matches[0])).Returns(true);
        _matchOptionComparer.Setup(c => c.Equals(x.MatchOptions[0], y.MatchOptions[0])).Returns(true);
        _oneEightiesComparer.Setup(c => c.Equals(x.OneEighties, y.OneEighties)).Returns(true);
        _hiChecksComparer.Setup(c => c.Equals(x.Over100Checkouts, y.Over100Checkouts)).Returns(true);

        var hashCodeX = _comparer.GetHashCode(x);
        var hashCodeY = _comparer.GetHashCode(y);

        Assert.That(hashCodeX, Is.EqualTo(hashCodeY));
    }

    private static CosmosGame CreateGame()
    {
        return new CosmosGame
        {
            Id = Guid.Parse("18A8B71C-6A4C-4A71-B082-693DCC29113B"),
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam(),
            Away = new GameTeam(),
            Matches =
            {
                new GameMatch(),
            },
            MatchOptions =
            {
                new GameMatchOption(),
            },
            DivisionId = Guid.Parse("4E4B2CEE-72F7-4AD4-809A-B7F3A36FBD43"),
            SeasonId = Guid.Parse("4AE5BCF9-64AA-4C1E-B420-D1AD5232028C"),
            OneEighties =
            {
                new GamePlayer(),
            },
            Over100Checkouts =
            {
                new NotablePlayer(),
            },
        };
    }
}
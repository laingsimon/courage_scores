using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private DivisionFixtureAdapter _adapter = null!;
    private Mock<IDivisionFixtureTeamAdapter> _divisionFixtureTeamAdapter = null!;
    private TeamDto _homeTeam = null!;
    private TeamDto _awayTeam = null!;
    private DivisionFixtureTeamDto _homeTeamDto = null!;
    private DivisionFixtureTeamDto _awayTeamDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionFixtureTeamAdapter = new Mock<IDivisionFixtureTeamAdapter>();
        _adapter = new DivisionFixtureAdapter(_divisionFixtureTeamAdapter.Object);
        _homeTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "home",
        };
        _awayTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "away",
        };
        _homeTeamDto = new DivisionFixtureTeamDto { Id = _homeTeam.Id };
        _awayTeamDto = new DivisionFixtureTeamDto { Id = _awayTeam.Id };

        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(It.Is<GameTeam>(t => t.Id == _homeTeam.Id), It.IsAny<string>(), _token))
            .ReturnsAsync(_homeTeamDto);
        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(It.Is<GameTeam>(t => t.Id == _awayTeam.Id), It.IsAny<string>(), _token))
            .ReturnsAsync(_awayTeamDto);
    }

    [Test]
    public async Task Adapt_WithHomeAndAwayTeamsAndHomeWin_SetsPropertiesCorrectly()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = true,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Matches =
            {
                new GameMatch
                {
                    Deleted = null,
                    HomeScore = 2,
                    AwayScore = 1,
                    HomePlayers = new List<GamePlayer> { new GamePlayer() },
                    AwayPlayers = new List<GamePlayer> { new GamePlayer() },
                },
            },
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
        };

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Date, Is.EqualTo(game.Date));
        Assert.That(result.Postponed, Is.EqualTo(game.Postponed));
        Assert.That(result.Proposal, Is.False);
        Assert.That(result.HomeScore, Is.EqualTo(1));
        Assert.That(result.AwayScore, Is.EqualTo(0));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
        Assert.That(result.IsKnockout, Is.EqualTo(game.IsKnockout));
    }

    [Test]
    public async Task Adapt_WithHomeAndAwayTeamsAndAwayWin_SetsPropertiesCorrectly()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = true,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Matches =
            {
                new GameMatch
                {
                    Deleted = null,
                    HomeScore = 1,
                    AwayScore = 2,
                    HomePlayers = new List<GamePlayer> { new GamePlayer() },
                    AwayPlayers = new List<GamePlayer> { new GamePlayer() },
                },
            },
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
        };

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Date, Is.EqualTo(game.Date));
        Assert.That(result.Postponed, Is.EqualTo(game.Postponed));
        Assert.That(result.Proposal, Is.False);
        Assert.That(result.HomeScore, Is.EqualTo(0));
        Assert.That(result.AwayScore, Is.EqualTo(1));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
        Assert.That(result.IsKnockout, Is.EqualTo(game.IsKnockout));
    }

    [Test]
    public async Task Adapt_WithDeletedMatches_IgnoresDeletedMatches()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = true,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Matches =
            {
                new GameMatch
                {
                    Deleted = null,
                    HomeScore = 2,
                    AwayScore = 1,
                    HomePlayers = new List<GamePlayer> { new GamePlayer() },
                    AwayPlayers = new List<GamePlayer> { new GamePlayer() },
                },
                new GameMatch
                {
                    Deleted = new DateTime(2001, 02, 03),
                    HomeScore = 2,
                    AwayScore = 1,
                    HomePlayers = new List<GamePlayer> { new GamePlayer() },
                    AwayPlayers = new List<GamePlayer> { new GamePlayer() },
                },
            },
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
        };

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, _token);

        Assert.That(result.HomeScore, Is.EqualTo(1));
        Assert.That(result.AwayScore, Is.EqualTo(0));
    }

    [Test]
    public async Task Adapt_WithoutAwayTeam_SetsPropertiesCorrectly()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = true,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
        };

        var result = await _adapter.Adapt(game, _homeTeam, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, null, _token));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
    }

    [Test]
    public async Task Adapt_WithoutEitherTeam_SetsPropertiesCorrectly()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = true,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
            AccoladesCount = true,
        };

        var result = await _adapter.Adapt(game, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, null, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, null, _token));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
        Assert.That(result.AccoladesCount, Is.EqualTo(game.AccoladesCount));
    }

    [Test]
    public async Task Adapt_WithNoPlayersInAnyMatch_ReturnsNoScoresForFixture()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = false,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Matches =
            {
                new GameMatch
                {
                    Deleted = null,
                    HomeScore = 2,
                    AwayScore = 1,
                },
            },
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
        };

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayScore, Is.Null);
    }

    [Test]
    public async Task Adapt_WithNoPlayersInAnyKnockoutMatch_ReturnsScoresForFixture()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            IsKnockout = true,
            Address = "address",
            Postponed = true,
            Date = new DateTime(2001, 02, 03),
            Matches =
            {
                new GameMatch
                {
                    Deleted = null,
                    HomeScore = 2,
                    AwayScore = 1,
                },
            },
            Home = new GameTeam
            {
                Id = _homeTeam.Id,
            },
            Away = new GameTeam
            {
                Id = _awayTeam.Id,
            },
        };

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.HomeScore, Is.EqualTo(1));
        Assert.That(result.AwayScore, Is.EqualTo(0));
    }

    [TestCase(true, true)]
    [TestCase(true, true)]
    public async Task ForUnselectedTeam_GivenTeam_SetsPropertiesCorrectly(bool isKnockout, bool expectedIsKnockout)
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "address",
            Name = "team",
        };
        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(team, _token))
            .ReturnsAsync(_homeTeamDto);

        var result = await _adapter.ForUnselectedTeam(team, isKnockout, Array.Empty<CosmosGame>(), _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Postponed, Is.False);
        Assert.That(result.Proposal, Is.False);
        Assert.That(result.AwayScore, Is.Null);
        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayTeam, Is.Null);
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.IsKnockout, Is.EqualTo(expectedIsKnockout));
        Assert.That(result.AccoladesCount, Is.True);
    }

    [Test]
    public async Task ForUnselectedTeam_GivenFixturesUsingAddress_SetsPropertyCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "address",
            Name = "team",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Home = new GameTeam { Id = Guid.NewGuid(), Name = "HOME", },
            Away = new GameTeam { Id = Guid.NewGuid(), Name = "AWAY", },
        };
        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(team, _token))
            .ReturnsAsync(_homeTeamDto);

        var result = await _adapter.ForUnselectedTeam(team, false, new[] { game }, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.FixturesUsingAddress.Count, Is.EqualTo(1));
        var otherDivisionFixtureDto = result.FixturesUsingAddress[0];
        Assert.That(otherDivisionFixtureDto.Id, Is.EqualTo(game.Id));
        Assert.That(otherDivisionFixtureDto.DivisionId, Is.EqualTo(game.DivisionId));
        Assert.That(otherDivisionFixtureDto.Home.Id, Is.EqualTo(game.Home.Id));
        Assert.That(otherDivisionFixtureDto.Home.Name, Is.EqualTo(game.Home.Name));
        Assert.That(otherDivisionFixtureDto.Away.Id, Is.EqualTo(game.Away.Id));
        Assert.That(otherDivisionFixtureDto.Away.Name, Is.EqualTo(game.Away.Name));
    }
}
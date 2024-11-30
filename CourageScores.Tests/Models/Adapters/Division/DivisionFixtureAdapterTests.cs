using CourageScores.Models;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Services;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureAdapterTests
{
    private readonly CancellationToken _token = new();
    private DivisionFixtureAdapter _adapter = null!;
    private Mock<IDivisionFixtureTeamAdapter> _divisionFixtureTeamAdapter = null!;
    private TeamDto _homeTeam = null!;
    private TeamDto _awayTeam = null!;
    private DivisionFixtureTeamDto _homeTeamDto = null!;
    private DivisionFixtureTeamDto _awayTeamDto = null!;
    private Mock<IFeatureService> _featureService = null!;
    private Mock<ISystemClock> _clock = null!;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionFixtureTeamAdapter = new Mock<IDivisionFixtureTeamAdapter>();
        _featureService = new Mock<IFeatureService>();
        _clock = new Mock<ISystemClock>();
        _adapter = new DivisionFixtureAdapter(_divisionFixtureTeamAdapter.Object, _featureService.Object, _clock.Object);
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, 07, TimeSpan.Zero);
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
        _homeTeamDto = new DivisionFixtureTeamDto
        {
            Id = _homeTeam.Id,
        };
        _awayTeamDto = new DivisionFixtureTeamDto
        {
            Id = _awayTeam.Id,
        };

        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(It.Is<GameTeam>(t => t.Id == _homeTeam.Id), It.IsAny<string>(), _token))
            .ReturnsAsync(_homeTeamDto);
        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(It.Is<GameTeam>(t => t.Id == _awayTeam.Id), It.IsAny<string>(), _token))
            .ReturnsAsync(_awayTeamDto);
        _clock.Setup(c => c.UtcNow).Returns(() => _now);
    }

    [Test]
    public async Task Adapt_WithHomeAndAwayTeamsAndHomeWin_SetsPropertiesCorrectly()
    {
        var game = new GameBuilder()
            .WithAddress("address")
            .WithDate(new DateTime(2001, 02, 03))
            .WithMatch(m => m
                .WithScores(2, 1)
                .WithHomePlayers(new GamePlayer())
                .WithAwayPlayers(new GamePlayer()))
            .WithTeams(_homeTeam, _awayTeam)
            .WithMatchOption(b => b.NumberOfLegs(3))
            .Build();
        var homeDivision = new DivisionDtoBuilder(name: "HOME DIVISION").Build();
        var awayDivision = new DivisionDtoBuilder(name: "AWAY DIVISION").Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, homeDivision, awayDivision, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Postponed, Is.EqualTo(game.Postponed));
        Assert.That(result.Proposal, Is.False);
        Assert.That(result.HomeScore, Is.EqualTo(1));
        Assert.That(result.AwayScore, Is.EqualTo(0));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
        Assert.That(result.IsKnockout, Is.EqualTo(game.IsKnockout));
        Assert.That(result.HomeDivision, Is.EqualTo(homeDivision));
        Assert.That(result.AwayDivision, Is.EqualTo(awayDivision));
    }

    [Test]
    public async Task Adapt_WithHomeAndAwayTeamsAndAwayWin_SetsPropertiesCorrectly()
    {
        var game = new GameBuilder()
            .WithAddress("address")
            .WithDate(new DateTime(2001, 02, 03))
            .WithMatch(m => m
                .WithScores(1, 2)
                .WithHomePlayers(new GamePlayer())
                .WithAwayPlayers(new GamePlayer()))
            .WithTeams(_homeTeam, _awayTeam)
            .WithMatchOption(b => b.NumberOfLegs(3))
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Postponed, Is.EqualTo(game.Postponed));
        Assert.That(result.Proposal, Is.False);
        Assert.That(result.HomeScore, Is.EqualTo(0));
        Assert.That(result.AwayScore, Is.EqualTo(1));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
        Assert.That(result.IsKnockout, Is.EqualTo(game.IsKnockout));
    }

    [Test]
    public async Task Adapt_WithScoresObscured_SetsHomeAndAwayScoresToNull()
    {
        var game = new GameBuilder()
            .WithAddress("address")
            .WithDate(new DateTime(2001, 02, 03))
            .WithMatch(m => m
                .WithScores(1, 2)
                .WithHomePlayers(new GamePlayer())
                .WithAwayPlayers(new GamePlayer()))
            .WithTeams(_homeTeam, _awayTeam)
            .WithMatchOption(b => b.NumberOfLegs(3))
            .Build();
        var featureValue = new ConfiguredFeatureDto
        {
            ConfiguredValue = TimeSpan.FromDays(10).ToString(),
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(s => s.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(featureValue);

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayScore, Is.Null);
    }

    [Test]
    public async Task Adapt_WithDeletedMatches_IgnoresDeletedMatches()
    {
        var game = new GameBuilder()
            .WithAddress("address")
            .Postponed()
            .WithDate(new DateTime(2001, 02, 03))
            .WithMatch(m => m
                .WithScores(2, 1)
                .WithHomePlayers(new GamePlayer())
                .WithAwayPlayers(new GamePlayer()))
            .WithMatch(m => m
                .Deleted(new DateTime(2001, 02, 03))
                .WithScores(2, 1)
                .WithHomePlayers(new GamePlayer())
                .WithAwayPlayers(new GamePlayer()))
            .WithTeams(_homeTeam, _awayTeam)
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        Assert.That(result.HomeScore, Is.EqualTo(1));
        Assert.That(result.AwayScore, Is.EqualTo(0));
    }

    [Test]
    public async Task Adapt_WithoutAwayTeam_SetsPropertiesCorrectly()
    {
        var game = new GameBuilder()
            .Knockout()
            .WithAddress("address")
            .Postponed()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(_homeTeam, _awayTeam)
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, null, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, null, _token));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
    }

    [Test]
    public async Task Adapt_WithoutEitherTeam_SetsPropertiesCorrectly()
    {
        var game = new GameBuilder()
            .Knockout()
            .WithAddress("address")
            .Postponed()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(_homeTeam, _awayTeam)
            .AccoladesCount()
            .Build();

        var result = await _adapter.Adapt(game, null, null, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, null, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, null, _token));
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.AwayTeam, Is.EqualTo(_awayTeamDto));
        Assert.That(result.AccoladesCount, Is.EqualTo(game.AccoladesCount));
    }

    [Test]
    public async Task Adapt_WithNoPlayersInAnyMatch_ReturnsNoScoresForFixture()
    {
        var game = new GameBuilder()
            .WithAddress("address")
            .Postponed()
            .WithDate(new DateTime(2001, 02, 03))
            .WithMatch(m => m
                .WithScores(2, 1))
            .WithTeams(_homeTeam, _awayTeam)
            .AccoladesCount()
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayScore, Is.Null);
    }

    [Test]
    public async Task Adapt_WithNoPlayersInAnyKnockoutMatch_ReturnsNullScoresForFixture()
    {
        var game = new GameBuilder()
            .Knockout()
            .WithAddress("address")
            .Postponed()
            .WithDate(new DateTime(2001, 02, 03))
            .WithMatch(m => m
                .WithScores(2, 1))
            .WithTeams(_homeTeam, _awayTeam)
            .AccoladesCount()
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayScore, Is.Null);
    }

    [Test]
    public async Task Adapt_WithNoPlayersInLeagueTriplesMatch_ReturnsNullScoresForFixture()
    {
        var game = new GameBuilder()
            .WithTeams(_homeTeam, _awayTeam)
            .WithMatch(MatchWithPlayers(3, 1))
            .WithMatch(MatchWithPlayers(3, 1))
            .WithMatch(MatchWithPlayers(3, 1))
            .WithMatch(MatchWithPlayers(3, 1))
            .WithMatch(MatchWithPlayers(3, 1))
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(1, 2))
            .WithMatch(new GameMatch())
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayScore, Is.Null);
    }

    [Test]
    public async Task Adapt_WithNoPlayersInKnockoutTriplesMatch_ReturnsScoresForFixture()
    {
        var game = new GameBuilder()
            .Knockout()
            .WithTeams(_homeTeam, _awayTeam)
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(2, 1))
            .WithMatch(MatchWithPlayers(1, 2))
            .WithMatch(new GameMatch())
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .WithMatchOption(b => b.NumberOfLegs(3))
            .Build();

        var result = await _adapter.Adapt(game, _homeTeam, _awayTeam, null, null, _token);

        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Home, _homeTeam.Address, _token));
        _divisionFixtureTeamAdapter.Verify(a => a.Adapt(game.Away, _awayTeam.Address, _token));
        Assert.That(result.HomeScore, Is.EqualTo(6));
        Assert.That(result.AwayScore, Is.EqualTo(1));
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
        var division = new DivisionDtoBuilder().Build();
        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(team, _token))
            .ReturnsAsync(_homeTeamDto);

        var result = await _adapter.ForUnselectedTeam(team, isKnockout, Array.Empty<CosmosGame>(), division, _token);

        Assert.That(result.Id, Is.EqualTo(team.Id));
        Assert.That(result.Postponed, Is.False);
        Assert.That(result.Proposal, Is.False);
        Assert.That(result.AwayScore, Is.Null);
        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayTeam, Is.Null);
        Assert.That(result.HomeTeam, Is.EqualTo(_homeTeamDto));
        Assert.That(result.IsKnockout, Is.EqualTo(expectedIsKnockout));
        Assert.That(result.AccoladesCount, Is.True);
        Assert.That(result.HomeDivision, Is.EqualTo(division));
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
        var game = new GameBuilder()
            .ForDivision(Guid.NewGuid())
            .WithTeams(
                new TeamDto { Id = Guid.NewGuid(), Name = "HOME" },
                new TeamDto { Id = Guid.NewGuid(), Name = "AWAY" })
            .AccoladesCount()
            .Build();
        _divisionFixtureTeamAdapter
            .Setup(a => a.Adapt(team, _token))
            .ReturnsAsync(_homeTeamDto);

        var result = await _adapter.ForUnselectedTeam(team, false, new[]
        {
            game,
        }, null, _token);

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

    private static GameMatch MatchWithPlayers(int homeScore, int awayScore)
    {
        return new GameMatch
        {
            HomeScore = homeScore,
            AwayScore = awayScore,
            HomePlayers = new List<GamePlayer>
            {
                new(),
            },
            AwayPlayers = new List<GamePlayer>
            {
                new(),
            },
        };
    }
}
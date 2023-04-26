using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataDtoFactoryTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private DivisionDataDtoFactory _factory = null!;
    private IDivisionPlayerAdapter _divisionPlayerAdapter = null!;
    private IDivisionTeamAdapter _divisionTeamAdapter = null!;
    private IDivisionDataSeasonAdapter _divisionDataSeasonAdapter = null!;
    private Mock<IDivisionFixtureDateAdapter> _divisionFixtureDateAdapter = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionPlayerAdapter = new DivisionPlayerAdapter(new PlayerPerformanceAdapter());
        _divisionTeamAdapter = new DivisionTeamAdapter();
        _divisionDataSeasonAdapter = new DivisionDataSeasonAdapter();
        _divisionFixtureDateAdapter = new Mock<IDivisionFixtureDateAdapter>();
        _userService = new Mock<IUserService>();
        _user = null;

        _factory = new DivisionDataDtoFactory(
            _divisionPlayerAdapter,
            _divisionTeamAdapter,
            _divisionDataSeasonAdapter,
            _divisionFixtureDateAdapter.Object,
            _userService.Object);

        _divisionFixtureDateAdapter
            .Setup(a => a.Adapt(
                It.IsAny<DateTime>(),
                It.IsAny<IReadOnlyCollection<CosmosGame>>(),
                It.IsAny<IReadOnlyCollection<TournamentGame>>(),
                It.IsAny<IReadOnlyCollection<FixtureDateNoteDto>>(),
                It.IsAny<IReadOnlyCollection<TeamDto>>(),
                _token))
            .ReturnsAsync(
                (DateTime date, IReadOnlyCollection<CosmosGame> _, IReadOnlyCollection<TournamentGame> _,
                    IReadOnlyCollection<FixtureDateNoteDto> _, IReadOnlyCollection<TeamDto> _, CancellationToken _) => new DivisionFixtureDateDto
                {
                    Date = date,
                });

        _userService
            .Setup(s => s.GetUser(_token))
            .ReturnsAsync(() => _user);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivision_SetsDivisionPropertiesCorrectly()
    {
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division 1",
        };

        var result = await _factory.CreateDivisionDataDto(context, division, _token);

        Assert.That(result.Id, Is.EqualTo(division.Id));
        Assert.That(result.Name, Is.EqualTo("division 1"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoDivision_SetsDivisionPropertiesCorrectly()
    {
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<all divisions>"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeams_SetsTeamsCorrectly()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var team3 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 3 - Not Playing" };
        var game = new CosmosGame
        {
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2, team3 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 2 - Playing", // more points
            "Team 1 - Playing",
            "Team 3 - Not Playing"
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsFixturesCorrectly()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                },
            },
        };
        var tournamentGame = new TournamentGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            AccoladesQualify = true,
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            new[] { tournamentGame },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { game.Date }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsPlayersCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var player1 = new GamePlayer { Id = Guid.NewGuid(), Name = "Home player" };
        var player2 = new GamePlayer { Id = Guid.NewGuid(), Name = "Away player" };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = player1.Id, Name = player1.Name } }
                }
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = player2.Id, Name = player2.Name } }
                }
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { player1 },
                    AwayPlayers = { player2 },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season);

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[] { player1.Name, player2.Name }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoFixtures_ReturnsNoPlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = Guid.NewGuid(), Name = "Team 1 player" } }
                }
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = Guid.NewGuid(), Name = "Team 2 player" } }
                }
            },
        };
        var context = new DivisionDataContext(
            new List<CosmosGame>(),
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season);

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Players, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = Guid.NewGuid(), Name = "Team 1 player" } }
                }
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = Guid.NewGuid(), Name = "Team 2 player" } }
                }
            },
        };
        var context = new DivisionDataContext(
            new List<CosmosGame>(),
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season);
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManagePlayers = true
            }
        };

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[] { "Team 1 player", "Team 2 player" }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var player1 = new GamePlayer { Id = Guid.NewGuid(), Name = "Home player" };
        var player2 = new GamePlayer { Id = Guid.NewGuid(), Name = "Away player" };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto { Id = player1.Id, Name = player1.Name },
                        new TeamPlayerDto { Id = Guid.NewGuid(), Name = "Team 1 not playing player" }
                    }
                }
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players = { new TeamPlayerDto { Id = player2.Id, Name = player2.Name } }
                }
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { player1 },
                    AwayPlayers = { player2 },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season);
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManagePlayers = true
            }
        };

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[] { player1.Name, player2.Name, "Team 1 not playing player" }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenSeason_SetsSeasonCorrectly()
    {
        var season = new SeasonDto { Id = Guid.NewGuid(), Name = "season" };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season);

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Season!.Id, Is.EqualTo(season.Id));
        Assert.That(result.Season!.Name, Is.EqualTo(season.Name));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrors_SetsDataErrorsCorrectly()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = true,
            }
        };
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "A" } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "B" }, new GamePlayer { Id = Guid.NewGuid(), Name = "C" } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.DataErrors, Is.EqualTo(new[] { $"{game.Id} (03 Feb 2001): Mismatching number of players: Home players (1): [A] vs Away players (2): [B, C]" }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotLoggedIn_SetsDataErrorsToEmpty()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "A" } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "B" }, new GamePlayer { Id = Guid.NewGuid(), Name = "C" } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotPermitted_SetsDataErrorsToEmpty()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = false,
            }
        };
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "A" } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "B" }, new GamePlayer { Id = Guid.NewGuid(), Name = "C" } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task SeasonNotFound_GivenNoDivision_ShouldReturnCorrectly()
    {
        var season1 = new SeasonDto { Id = Guid.NewGuid(), Name = "season1" };
        var season2 = new SeasonDto { Id = Guid.NewGuid(), Name = "season2" };
        var seasons = new[] { season1, season2 };

        var result = await _factory.SeasonNotFound(null, seasons, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<all divisions>"));
        Assert.That(result.Season, Is.Null);
    }

    [Test]
    public async Task SeasonNotFound_GivenDivision_ShouldReturnCorrectly()
    {
        var season1 = new SeasonDto { Id = Guid.NewGuid(), Name = "season1" };
        var season2 = new SeasonDto { Id = Guid.NewGuid(), Name = "season2" };
        var seasons = new[] { season1, season2 };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division1"
        };

        var result = await _factory.SeasonNotFound(division, seasons, _token);

        Assert.That(result.Id, Is.EqualTo(division.Id));
        Assert.That(result.Name, Is.EqualTo("division1"));
    }
}
